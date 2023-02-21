const express = require("express")
const { StatusCodes } = require("http-status-codes")
const { handlePaystackWebhook } = require("../controllers/webhook-controller")

const router = express.Router()

router.route("/webhooks/paystack").post(handlePaystackWebhook).get(async (req, res) => { res.status(StatusCodes.OK).json({ webhook: "Get method" }) })

module.exports = router