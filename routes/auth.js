const express = require("express")

const { logout, login, resetPassword, changeEmail, verifyEmailWithOTP, newTokenFromRefresh: refresh, startPasswordResetFlow } = require("../controllers/auth")
const { isPersonAuthorized, removeAuthCookie } = require("../middleware/auth middleware")



const router = express.Router()

router.post("/login", [removeAuthCookie], login)


router.get("/refresh-token", refresh)

router.get("/logout", logout)

router.post("/reset-password", resetPassword)

router.post("/start-password-reset", startPasswordResetFlow)

router.post("/change-email", [isPersonAuthorized], changeEmail)


router.post("/verify-email", [isPersonAuthorized], verifyEmailWithOTP)



module.exports = router