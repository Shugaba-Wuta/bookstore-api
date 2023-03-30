const express = require("express")
// const guard = require("express-jwt-permissions")()
const { initiatePay, getOrders, getOrder, updateOrder, createOrder, getSellerOrders, orderUpdateStatus, getTransactionDetail } = require("../controllers/order-controller")
const { isPersonAuthorized } = require("../middleware/auth middleware")


const router = express.Router()


router.route("/user/:userID")
    .get(isPersonAuthorized, getOrders).post(isPersonAuthorized, createOrder)

router.route("/:orderID").get(getOrder).patch(isPersonAuthorized, updateOrder)

router.post("/:orderID/initiatePayment", isPersonAuthorized, initiatePay)
router.post("/seller/update", isPersonAuthorized, orderUpdateStatus)
router.post("/seller/view", isPersonAuthorized, getSellerOrders)
router.post("/payment/details", getTransactionDetail)








module.exports = router