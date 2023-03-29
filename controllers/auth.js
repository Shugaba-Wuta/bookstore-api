"use strict"
const jwt = require("jsonwebtoken")
const ms = require("ms")
const { BadRequestError, NotFoundError, UnauthenticatedError, Conflict } = require("../errors")
const { User, Session, Staff, Seller, TOTP, Cart } = require("../models")
const { StatusCodes } = require("http-status-codes")
const { createToken } = require("../utils/auth")
const { sendEmail } = require("../mailing/utils")
const { MAX_OTP_TIME_IN_SECONDS, TIME_TOLERANCE_FOR_OTP } = require("../config/app-data")
const RESET_PASSWORD = "RESET PASSWORD"
const RESET_EMAIL = "RESET EMAIL"


const login = async (req, res) => {
    /*Check if DB record match provided credentials*/

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
    var person
    switch (role) {
        case "user":
            person = await User.findOne({ email: email, deleted: false })
            break
        case "seller":
            person = await Seller.findOne({ email: email, deleted: false })
            break
        case "admin":
            person = await Staff.findOne({ email: email, deleted: false })
            break
        case "staff":
            person = await Staff.findOne({ email: email, deleted: false })
            break
        default:
            throw new BadRequestError("Please provide a valid role")
    }

    //Ensure passwords match
    const isPasswordMatch = person ? await person.comparePassword(password) : false
    if (!isPasswordMatch) {
        throw new NotFoundError("email and password does not match any record")
    }

    //Migrate sessionID to the now logged in user
    const oldPayload = req.user
    let payload
    //if token exists, update the Session schema of the token to include userID, otherwise create a new session
    if (oldPayload) {
        const personModel = role[0].toUpperCase() + role.slice(1)
        //TODO #10 Log occurrence where personModel !== oldPayload.
        await Session.findOneAndUpdate({ _id: oldPayload.sessionID }, { user: person._id, userModel: personModel, role })
        //Update cart personID with with the authenticated userID
        await Cart.updateMany({ sessionID: oldPayload.sessionID, personID: null, active: true }, { personID: person._id, personSchema: personModel })
        payload = {
            user: {
                userID: String(person._id),
                fullName: person.fullName,
                role: person.role,
                sessionID: oldPayload.sessionID,
                permissions: person.permissions
            }
        }

    } else {
        const session = await new Session({
            IP: req.ip,
            userAgent: req.get("user-agent")
        }).save()
        payload = {
            user: {
                fullName: person.fullName,
                userID: String(person._id),
                role: person.role,
                sessionID: session._id,
                permissions: person.permissions
            }
        }
    }

    //Recreate access and refresh tokens to be added to response object
    const token = await createToken(payload)
    const cookieToken = await createToken(payload, "refresh")
    const cookieDuration = ms(process.env.COOKIE_REFRESH_DURATION) || 3 * 24 * 60 * 60 * 1000 // set to expire in 3 days by default.
    res.cookie("cookieToken", cookieToken, { maxAge: cookieDuration, signed: true, httpOnly: true, sameSite: "none", secure: false, overwrite: true })

    const resBody = { accessToken: token, userID: payload.user.userID, verifiedEmail: person.verifiedEmail }

    if (role === "seller")
        resBody.verified = person.verified
    return res.status(StatusCodes.OK).json(resBody)
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
    else if (req.signedCookies.cookieToken) {
        token = req.signedCookies.cookieToken;
    }
    if (!token) {
        res.clearCookie("cookieToken")
        throw new UnauthenticatedError("Login required")
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY)
    const user = { user: { name: payload.user.fullName, userID: payload.user.userID, role: payload.user.role, permissions: payload.user.permissions } }
    if (payload && payload.user.userID) {
        const newToken = await createToken(user)
        return res.json({ token: newToken })
    }
    res.clearCookie("cookieToken")
    throw new UnauthenticatedError("Login required")
}
const logout = async (req, res) => {
    res.clearCookie("cookieToken")
    if (!req.user.userID) {
        throw new UnauthenticatedError("User not logged in")
    }
    res.status(StatusCodes.OK).json({ message: "logged out successful", success: true, })
}

const startPasswordResetFlow = async (req, res) => {
    const { email, role } = req.body
    if (!email) {
        throw new BadRequestError("email is a required field")
    }
    if (!role) {
        throw new BadRequestError("role is a required field")
    }
    const user = await User.findOne({ email, role })
    const seller = await Seller.findOne({ email, role })
    const staff = await Staff.findOne({ email, role })
    const person = user || seller || staff
    if (!person) {
        throw new BadRequestError("invalid user email")
    }
    if (!person.verifiedEmail) {
        throw new Conflict("Unable to reset password on unverified email")
    }
    const personSchema = String(person.role[0]).toUpperCase() + String(person.role).substring(1).toLowerCase()
    const tokenCode = await TOTP.createAToken(String(person._id), personSchema, person.email, RESET_PASSWORD)

    //Send an email with token
    await sendEmail({
        recipients: [person.email], subject: "Reset Password Token", template: "password-change", context: { title: "Reset password token", code: tokenCode, duration: (MAX_OTP_TIME_IN_SECONDS * TIME_TOLERANCE_FOR_OTP) / 60, email: person.email }
    })

    res.status(StatusCodes.OK).json({ message: "Check your email for the OTP", success: true, result: null })
}
const resetPassword = async (req, res) => {
    const { role, email, otp, newPassword } = req.body
    if (!email) throw new BadRequestError(`Required field missing: 'email'`)
    if (!role) throw new BadRequestError(`Required field missing: 'role' `)
    if (!otp) throw new BadRequestError(`Required field missing: 'otp' `)
    if (!newPassword) throw new BadRequestError(`Required field missing: 'newPassword'`)

    const user = await User.findOne({ email, role })
    const seller = await Seller.findOne({ email, role })
    const staff = await Staff.findOne({ email, role })
    const person = user || seller || staff
    if (!person) {
        throw new BadRequestError("invalid user email")
    }
    const personSchema = String(person.role[0]).toUpperCase() + String(person.role).substring(1).toLowerCase()
    const totp = await TOTP.findOne({ email: person.email, personSchema, used: false, totp: otp, purpose: RESET_PASSWORD })
    if (!totp) {
        throw new NotFoundError("Token is invalid")
    }
    person.password = newPassword
    await person.save()
    totp.used = true
    await totp.save()
    //Send an email notifying of password change
    await sendEmail({
        recipients: [person.email], subject: "Password Change Successful", template: "password-change-success", context: {
            title: "Intro", email: person.email, passwordChangeTime: String(new Date())
        }
    })
    return res.status(StatusCodes.OK).json({ message: "Password change was successful", result: null, success: true })
}

const changeEmail = async (req, res) => {
    const { role, email, userID: personID } = req.body
    if (!email) throw new BadRequestError(`Required field missing: 'email'`)
    if (!role) throw new BadRequestError(`Required field missing: 'role' `)
    if (!personID) throw new BadRequestError(`Required field missing: 'userID' `)

    const user = await User.findOne({ role, _id: personID })
    const seller = await Seller.findOne({ role, _id: personID })
    const staff = await Staff.findOne({ role, _id: personID })
    const person = user || seller || staff
    if (!person) {
        throw new NotFoundError("user not found")
    }

    const personSchema = String(person.role[0]).toUpperCase() + String(person.role).substring(1).toLowerCase()

    //Create a new token
    const tokenCode = await TOTP.createAToken(String(person._id), personSchema, email, RESET_EMAIL)

    person.email = email
    person.verifiedEmail = false
    await person.save()
    //Send an email notifying of email change
    await sendEmail({
        recipients: [person.email], subject: "Change Email Token", template: "email-change", context: { title: "Change email", code: tokenCode, duration: (MAX_OTP_TIME_IN_SECONDS * TIME_TOLERANCE_FOR_OTP) / 60, email: person.email }
    })

    return res.status(StatusCodes.OK).json({ message: `OTP has been sent to ${person.email}`, result: null, success: true })

}
const verifyEmailWithOTP = async (req, res) => {
    const { otp, userID: personID, role } = req.body
    if (!role) throw new BadRequestError(`Required field missing: 'role' `)
    if (!otp) throw new BadRequestError(`Required field missing: 'otp' `)
    if (!personID) throw new BadRequestError(`Required field missing: 'userID' `)

    const user = await User.findOne({ role, _id: personID })
    const seller = await Seller.findOne({ role, _id: personID })
    const staff = await Staff.findOne({ role, _id: personID })
    const person = user || seller || staff
    if (!person) {
        throw new NotFoundError("user not found")
    }

    const personSchema = String(person.role[0]).toUpperCase() + String(person.role).substring(1).toLowerCase()
    //Get token
    const totp = await TOTP.findOne({ email: person.email, totp: otp, used: false, personSchema, purpose: RESET_EMAIL })
    if (!totp) {
        throw new NotFoundError("Token is invalid")
    }

    //Modify email and OTP accordingly
    person.verifiedEmail = true
    await person.save()
    totp.used = true
    await totp.save()
    //Send an email notifying of password change
    await sendEmail({
        recipients: [person.email], subject: "Email Change Successful", template: "email-change-success", context: {
            title: "Email change successful", email: person.email, emailChangeTime: String(new Date())
        }
    })

    return res.status(StatusCodes.OK).json({ message: "Email has been verified", success: true, result: null })
}



module.exports = { login, newTokenFromRefresh, logout, resetPassword, changeEmail, verifyEmailWithOTP, startPasswordResetFlow }
