const CustomError = require('../errors');
const { Session } = require('../models');
const { isTokenValid, createToken } = require('../utils/jwt');
const ms = require("ms")

const assignSessionID = async (req, res, next) => {
  let token;
  //Look for token (bearer or refresh)
  // check header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }
  // check cookies
  else if (req.signedCookies.refreshToken) {
    token = req.signedCookies.refreshToken;
  }
  //Check if token is valid and issue another token if token is not valid.
  let payload
  try {

    payload = isTokenValid(token)

  } catch (err) {

    const newSession = await Session({
      userAgent: req.get('user-agent'),
      IP: req.ip
    }).save()
    payload = { user: { sessionID: String(newSession._id), userID: null, role: null, fullName: null } }
    const refreshToken = createToken(payload, "refresh")
    const refreshDuration = ms(process.env.REFRESH_DURATION) || 3 * 24 * 60 * 60
    res.cookie("refreshToken", refreshToken, { maxAge: refreshDuration, signed: true, httpOnly: true, secured: true })



  } finally {
    req.user = {
      userID: payload.user.userID,
      role: payload.user.role,
      fullName: payload.user.fullName,
      sessionID: payload.user.sessionID,
    };
    console.log("Session ID: ", payload.user.sessionID)
    next()
  }
}

const authenticateUser = async (req, res, next) => {
  // Check if the user has logged in and has token with valid userID
  let token;
  // check header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }
  // check cookies
  else if (req.signedCookies.refreshToken) {
    token = req.signedCookies.refreshToken;
  }
  try {
    const payload = isTokenValid(token);

    // Attach the user and his permissions to the req object
    req.user = {
      userID: payload.user.userID,
      role: payload.user.role,
      fullName: payload.user.fullName,
      sessionID: payload.user.sessionID,
    };

  } catch (error) {
    throw new CustomError.UnauthenticatedError('Authentication invalid');
  }
  if (!payload.user.userID) {
    throw new CustomError.UnauthenticatedError('Log in to proceed');
  }
  next();
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new CustomError.UnauthorizedError(
        'Unauthorized to access this route'
      );
    }
    next();
  };
};

module.exports = { authenticateUser, authorizeRoles, assignSessionID };
