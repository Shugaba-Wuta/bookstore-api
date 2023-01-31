const express = require("express")
const guard = require("express-jwt-permissions")()
const { initiatePay } = require("../controllers/pay-controller")







const router = express.Router()

router.get("/pay/initiate/:cartID", [guard.check(["purchase"], ["user:read", "user:write"])], initiatePay)








module.exports = router