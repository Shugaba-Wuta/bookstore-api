const express = require("express")

const { logout, login, resetPassword, changeEmail, verifyEmailWithOTP, newTokenFromRefresh: refresh, startPasswordResetFlow } = require("../controllers/auth")
const { isPersonAuthorized, allowOrigin } = require("../middleware/auth middleware")



const router = express.Router()

router.post("/login", allowOrigin("http://localhost:3000"), login)


router.get("/refresh-token", allowOrigin("http://localhost:3000"), refresh)

router.get("/logout", allowOrigin("http://localhost:3000"), logout)

router.post("/reset-password", resetPassword)

router.post("/start-password-reset", startPasswordResetFlow)

router.post("/change-email", [isPersonAuthorized], changeEmail)


router.post("/verify-email", [isPersonAuthorized], verifyEmailWithOTP)



module.exports = router