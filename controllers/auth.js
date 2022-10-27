const jwt = require("jsonwebtoken")
const ms = require("ms")
const { BadRequestError, NotFoundError, UnauthenticatedError } = require("../errors")
const { User } = require("../models")
const { StatusCodes } = require("http-status-codes")
const { createToken } = require("../utils/jwt")

const login = async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        throw new BadRequestError("Please provide email and password")
    }
    const dbUser = await User.findOne({ email, active: true }, "_id password email role fullName name")
    if (!dbUser) {
        throw new NotFoundError("email and password does not match any record")
    }
    const isPasswordMatch = await dbUser.comparePassword(password)
    if (!isPasswordMatch) {
        throw new NotFoundError("email and password does not match any record")
    }
    const payload = { user: { name: dbUser.fullName, userID: String(dbUser._id), role: dbUser.role } }
    const token = await createToken(payload)
    const refreshToken = await createToken(payload, "refresh")
    const refreshDuration = ms(process.env.REFRESH_DURATION) || 3 * 24 * 60 * 60 * 1000 // set to expire in 3 days by default.
    res.cookie("refreshToken", refreshToken, { maxAge: refreshDuration, signed: true, httpOnly: true, secured: true })
    return res.status(StatusCodes.OK).json({ accessToken: token, refreshToken })
}

const newTokenFromRefresh = async (req, res) => {
    const { refreshToken: cookie } = req.signedCookies
    if (!cookie) {
        throw new UnauthenticatedError("Please log in")
    }
    const payload = jwt.verify(cookie, process.env.JWT_SECRET_KEY)
    const user = { user: { name: payload.user.name, userID: payload.user.userID, role: payload.user.role } }
    if (payload) {
        const newToken = await createToken(user)
        return res.json({ token: newToken })
    }
    throw Error("Token")
}
const logout = async (req, res) => {
    const { refreshToken: cookie } = req.signedCookies
    if (!cookie) {
        throw new UnauthenticatedError("Please log in")
    }
    res.clearCookie("refreshToken")
    res.status(StatusCodes.OK).json({})
}


module.exports = { login, newTokenFromRefresh, logout }