"use strict"
const jwt = require("jsonwebtoken")
const ms = require("ms")
const { BadRequestError, NotFoundError, UnauthenticatedError } = require("../errors")
const { User, Session, Staff, Seller, TOTP } = require("../models")
const { StatusCodes } = require("http-status-codes")
const { createToken, generateOtpCode, isOTPValid } = require("../utils/auth")
const mongoose = require("mongoose")
const { OTP_CODE_LENGTH } = require("../app-data")







const login = async (req, res) => {
    //
    //Check if DB record match provided credentials
    //
    let { email, password, role } = req.body
    //Get and format role of user
    if (!role) {
        throw new BadRequestError("Please provide user's role")
    }
    role = role.trim().toLowerCase()

    if (!email || !password) {
        throw new BadRequestError("Please provide email and password")
    }
    email = email.trim().toLowerCase()
    var query
    switch (role) {
        case "user":
            query = await User.findOne({ email: email, deleted: false })
            break
        case "seller":
            query = await Seller.findOne({ email: email, deleted: false })
            break
        case "admin":
            query = await Staff.findOne({ email: email, deleted: false })
            break
        case "staff":
            query = await Staff.findOne({ email: email, deleted: false })
            break
        default:
            throw new BadRequestError("Please provide a valid user role")
    }

    //Ensure passwords match
    const isPasswordMatch = query ? await query.comparePassword(password) : false
    if (!isPasswordMatch) {
        throw new NotFoundError("email and password does not match any record")
    }

    //Migrate sessionID to the now logged in user
    const oldPayload = req.user
    let payload, session
    //if token exists, update the Session schema of the token to include userID, otherwise create a new session
    if (oldPayload) {
        session = await Session.findOne({ _id: oldPayload.sessionID }, { user: mongoose.Types.ObjectId(query._id) })
        payload = {
            user: {
                userID: String(query._id),
                fullName: query.fullName,
                role: query.role,
                sessionID: oldPayload.sessionID
            }
        }

    } else {
        const session = await new Session({
            IP: req.ip,
            userAgent: req.get("user-agent")

        }).save()
        payload = {
            user: {
                fullName: query.fullName,
                userID: String(query._id),
                role: query.role,
                sessionID: session._id
            }
        }
    }

    //Recreate access and refresh tokens to be added to response object 
    const token = await createToken(payload)
    const refreshToken = await createToken(payload, "refresh")
    const refreshDuration = ms(process.env.REFRESH_DURATION) || 3 * 24 * 60 * 60 * 1000 // set to expire in 3 days by default.
    res.cookie("refreshToken", refreshToken, { maxAge: refreshDuration, signed: true, httpOnly: true, secured: true })


    return res.status(StatusCodes.OK).json({ accessToken: token, userID: payload.user.userID })
}

const newTokenFromRefresh = async (req, res) => {

    //Look for token (bearer or refresh)
    // check header
    let token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
        token = authHeader.split(' ')[1];
    }
    // check cookies
    else if (req.signedCookies.refreshToken) {
        token = req.signedCookies.refreshToken;
    }
    if (!token) {
        throw new UnauthenticatedError("Please log in")
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY)
    const user = { user: { name: payload.user.fullName, userID: payload.user.userID, role: payload.user.role } }
    if (payload) {
        const newToken = await createToken(user)
        return res.json({ token: newToken })
    }
    throw UnauthenticatedError("Please login to refresh access tokens")
}
const logout = async (req, res) => {
    res.clearCookie("refreshToken")
    res.status(StatusCodes.OK).json({ message: "logged out successful", success: true, })
}
const startPasswordResetFlow = async (req, res) => {
    const { email, role } = req.body
    if (!email) {
        throw new BadRequestError(`Required field missing or invalid: 'email'`)
    }
    if (!role) {
        throw new BadRequestError(`Required field missing: 'role'`)
    }
    let query
    switch (role) {
        case "seller":
            query = Seller.findOne({ deleted: false, email, verifiedEmail: true })
            break
        case "user":
            query = User.findOne({ deleted: false, email, verifiedEmail: true })
            break
        case "staff":
            query = Staff.findOne({ deleted: false, email, verifiedEmail: true })
            break
        case "admin":
            query = User.findOne({ deleted: false, email, verifiedEmail: true })
            break
        default:
            throw new BadRequestError('Invalid role provided')
    }
    const unusedOTPInDB = await TOTP.findOne({
        email,
        used: false,

    })
    //Check if TOTP exists can still be used
    const isOldOTPValid = isOTPValid(unusedOTPInDB)
    if (isOldOTPValid) {
        return res.status(StatusCodes.OK).json({ message: "Check your email for the OTP", success: true })
    }
    //If no valid OTP exists, delete any OTP in DB for user and create a new OTP 
    await TOTP.deleteMany({ email })
    const dbPerson = await query
    if (!dbPerson) {
        throw new NotFoundError(`Account not found ${email}`)
    }
    //Generate set OTP 
    const otpCode = generateOtpCode(OTP_CODE_LENGTH)
    await TOTP.create({
        email,
        totp: otpCode,
        userType: role[0].toUpperCase() + role.slice(1),
        user: dbPerson._id
    })
    //send email with the OTP 



    res.status(StatusCodes.OK).json({ message: "Check your email for the OTP", success: true, })
}
const resetPassword = async (req, res) => {
    const { role, email, otp, newPassword } = req.body
    if (!email) throw new BadRequestError(`Required field missing: 'email'`)
    if (!role) throw new BadRequestError(`Required field missing: 'role' `)
    if (!otp) throw new BadRequestError(`Required field missing: 'otp' `)
    if (!newPassword) throw new BadRequestError(`Required field missing: 'newPassword'`)

    let query
    switch (role) {
        case "seller":
            query = Seller.findOne({ deleted: false, email, verifiedEmail: true })
            break
        case "user":
            query = User.findOne({ deleted: false, email, verifiedEmail: true })
            break
        case "staff":
            query = Staff.findOne({ deleted: false, email, verifiedEmail: true })
            break
        case "admin":
            query = User.findOne({ deleted: false, email, verifiedEmail: true })
            break
        default:
            throw new BadRequestError('Invalid role provided')
    }
    const dbPerson = await query
    if (!dbPerson) {
        throw new NotFoundError(`Account not found ${email}`)
    }
    dbPerson.password = newPassword
    await dbPerson.save()
    return res.status(StatusCodes.OK).json({ message: "Email has been sent" })


}

const changeEmail = async (req, res) => {
    const { role, email } = req.body
    if (!email) throw new BadRequestError(`Required field missing: 'email'`)
    if (!role) throw new BadRequestError(`Required field missing: 'role' `)

    let query
    switch (role) {
        case "seller":
            query = Seller.findOne({ deleted: false, email, verifiedEmail: true },)
            break
        case "user":
            query = User.findOne({ deleted: false, email, verifiedEmail: true })
            break
        case "staff":
            query = Staff.findOne({ deleted: false, email, verifiedEmail: true })
            break
        case "admin":
            query = User.findOne({ deleted: false, email, verifiedEmail: true })
            break
        default:
            throw new BadRequestError('Invalid role provided')
    }
    if (!query) {
        throw new NotFoundError(`No record matched ${email}`)
    }
    return res.status(StatusCodes.OK).json({ message: "Email has been" })

}
const verifyEmailWithOTP = async (req, res) => {

}



module.exports = { login, newTokenFromRefresh, logout, resetPassword, changeEmail, verifyEmailWithOTP, startPasswordResetFlow }
