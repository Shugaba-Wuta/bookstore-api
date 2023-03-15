const express = require("express")
// const guard = require("express-jwt-permissions")()
const { initiatePay, getOrders, getOrder, updateOrder, createOrder, getSellerOrders, orderUpdateStatus, getTransactionDetail } = require("../controllers/order-controller")






const router = express.Router()


router.route("/user/:userID")
    .get(getOrders).post(createOrder)

router.route("/:orderID").get(getOrder).patch(updateOrder)

router.post("/:orderID/initiatePayment", initiatePay)
router.post("/seller/update", orderUpdateStatus)
router.post("/seller/view", getSellerOrders)
router.post("/payment/details", getTransactionDetail)








module.exports = router