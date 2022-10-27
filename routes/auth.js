const express = require("express")

const { login } = require("../controllers/auth")
const { logout } = require("../controllers/auth")
const { newTokenFromRefresh: refresh } = require("../controllers/auth")


const router = express.Router()
router.post("/login", login)
router.get("/refresh-token", refresh)
router.get("/logout", logout)



module.exports = router