const jwt = require("jsonwebtoken")
const createToken = async (payload, type = "token") => {
    const duration = type === "token" ? process.env.TOKEN_DURATION : process.env.REFRESH_DURATION
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: duration })
    return token
}
const isTokenValid = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET_KEY)


}


module.exports = { isTokenValid, createToken }