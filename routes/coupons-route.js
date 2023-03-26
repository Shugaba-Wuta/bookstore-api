const { createCoupon, getCoupons, deleteCoupon, getSingleCoupon } = require("../controllers/coupons-controller")
const express = require("express")


const router = express.Router()

router.route("/:couponID").get(getSingleCoupon).delete(deleteCoupon)

router.get("/", getCoupons).post("/", createCoupon)

module.exports = router