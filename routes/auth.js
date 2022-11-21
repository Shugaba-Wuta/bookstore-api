const express = require("express")

const { logout, login, resetPassword, changeEmail, verifyEmailWithOTP, newTokenFromRefresh: refresh, startPasswordResetFlow } = require("../controllers/auth")
const { authorizeRoles, ensureSamePerson } = require("../middleware/auth middleware")



const router = express.Router()

router.post("/login", login)


router.get("/refresh-token", [authorizeRoles("seller", "staff", "admin", "user"), ensureSamePerson], refresh)

router.get("/logout", logout)

router.post("/reset-password", resetPassword)

router.post("/start-password-reset", startPasswordResetFlow)
 
router.post("/change-email", [authorizeRoles("seller", "staff", "admin", "user"), ensureSamePerson], changeEmail)

 
router.post("/verify-email", [authorizeRoles("seller", "staff", "admin", "user"), ensureSamePerson], verifyEmailWithOTP)



module.exports = router