const CustomError = require('../errors');
const { Session } = require('../models');
const ms = require("ms")

const { UnauthenticatedError } = require("../errors")
const { isTokenValid, createToken } = require('../utils/auth');

// const elevatedRoles = ["admin", "manager", "staff"]

const assignSessionID = async (req, res, next) => {
  let token;
  //Look for token (bearer or refresh)
  // check header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    console.log("Bearer")
    token = authHeader.split(' ')[1];
  }
  // check cookies
  else if (req.signedCookies.cookieToken) {
    token = req.signedCookies.cookieToken;
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
    const cookieToken = await createToken(payload, "refresh")
    const cookieDuration = ms(process.env.COOKIE_REFRESH_DURATION) || 3 * 24 * 60 * 60
    res.cookie("cookieToken", cookieToken, { maxAge: cookieDuration, signed: true, httpOnly: true, secured: true })



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
  // check token bearer
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }
  // check cookies
  else if (req.signedCookies.cookieToken) {
    token = req.signedCookies.cookieToken;
  }
  try {
    var payload = isTokenValid(token);

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
const ensureSamePerson = async (req, res, next) => {
  const tokenUserID = req.user.userID
  const userParamID = req.params.sellerID || req.params.userID

  if (userParamID && (userParamID !== tokenUserID)) {
    throw new UnauthenticatedError("Unauthorized, cannot proceed!")
  }

  return next()
}

module.exports = { authenticateUser, authorizeRoles, assignSessionID, ensureSamePerson };
