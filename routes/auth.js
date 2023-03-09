const express = require("express")

const { logout, login, resetPassword, changeEmail, verifyEmailWithOTP, newTokenFromRefresh: refresh, startPasswordResetFlow } = require("../controllers/auth")
const { authorizeRoles, isPersonAuthorized } = require("../middleware/auth middleware")



const router = express.Router()

router.post("/login", login)


router.get("/refresh-token", refresh)

router.get("/logout", logout)

router.post("/reset-password", resetPassword)

router.post("/start-password-reset", startPasswordResetFlow)

router.post("/change-email", [authorizeRoles("seller", "staff", "admin", "user"), isPersonAuthorized], changeEmail)


router.post("/verify-email", [authorizeRoles("seller", "staff", "admin", "user"), isPersonAuthorized], verifyEmailWithOTP)



module.exports = router