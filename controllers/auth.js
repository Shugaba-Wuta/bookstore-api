const jwt = require("jsonwebtoken")
const ms = require("ms")
const { BadRequestError, NotFoundError, UnauthenticatedError } = require("../errors")
const { User, Session, Staff, Seller } = require("../models")
const { StatusCodes } = require("http-status-codes")
const { createToken, isTokenValid } = require("../utils/jwt")
const mongoose = require("mongoose")
const login = async (req, res) => {
    //
    //Check if DB record match provided credentials
    //
    const { email, password } = req.body
    if (!email || !password) {
        throw new BadRequestError("Please provide email and password")
    }
    let dbUser
    //Check if credentials belong to user
    dbUser = await User.findOne({ email, deleted: false }, "_id password email role fullName name")
    //check if credentials belong to seller
    if (!dbUser) {
        dbUser = await Seller.findOne({ email, deleted: false })
    }
    //check if credentials belong to staff
    else if (!dbUser) {
        dbUser = await Staff.findOne({ email })
    }
    //Still does not match any record 
    else if (!dbUser | dbUser === null) {
        throw new NotFoundError("email and password does not match any record")
    }
    console.log(dbUser, !dbUser, typeof (dbUser))

    //Ensure passwords match
    const isPasswordMatch = await dbUser.comparePassword(password)
    if (!isPasswordMatch) {
        throw new NotFoundError("email and password does not match any record")
    }

    //Migrate sessionID to the now logged in user
    const oldPayload = req.user
    let payload, session
    //if token exists, update the Session schema of the token to include userID, otherwise create a new session
    if (oldPayload) {

        session = await Session.findOneAndUpdate({ _id: oldPayload.sessionID }, { user: mongoose.Types.ObjectId(dbUser._id) })
        payload = {
            user: {
                userID: String(dbUser._id),
                fullName: dbUser.fullName,
                role: dbUser.role,
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
                fullName: dbUser.fullName,
                userID: String(dbUser._id),
                role: dbUser.role,
                sessionID: session._id
            }
        }
    }

    //Recreate access and refresh tokens to be added to response object 
    const token = await createToken(payload)
    const refreshToken = await createToken(payload, "refresh")
    const refreshDuration = ms(process.env.REFRESH_DURATION) || 3 * 24 * 60 * 60 * 1000 // set to expire in 3 days by default.
    res.cookie("refreshToken", refreshToken, { maxAge: refreshDuration, signed: true, httpOnly: true, secured: true })
    return res.status(StatusCodes.OK).json({ accessToken: token, refreshToken })
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


module.exports = { login, newTokenFromRefresh, logout }
