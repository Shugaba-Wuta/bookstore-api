"use strict"
const jwt = require("jsonwebtoken")
const crypto = require("crypto")


const { MAX_OTP_TIME_IN_SECONDS, TIME_TOLERANCE_FOR_OTP } = require("../app-data")

const createToken = async (payload, type = "token") => {
    const duration = type === "token" ? process.env.TOKEN_DURATION : process.env.REFRESH_DURATION
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: duration })
    return token
}
const isTokenValid = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET_KEY)
}
const generateOtpCode = (CODE_LENGTH) => {
    const minOTPRange = Number(10 ** (CODE_LENGTH - 1))
    const maxOTPRange = Number(10 ** (CODE_LENGTH))
    return crypto.randomInt(minOTPRange, maxOTPRange)
}
const isOTPValid = (otp) => {
    if (otp && otp.createdAt) {
        return Math.floor(Date.parse(otp.createdAt) + TIME_TOLERANCE_FOR_OTP * MAX_OTP_TIME_IN_SECONDS) <= Date.now()
    }
    return false
}


module.exports = { isTokenValid, createToken, generateOtpCode, isOTPValid }