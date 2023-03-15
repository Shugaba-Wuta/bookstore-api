// const nanoid = require("nanoid")
const { Coupon } = require("../models")


const getCouponDetail = async ({ code, bookID = undefined, scope = "Book" }) => {
    /*
        Returns coupon `id`, `type` and `value` if coupon is valid for given bookID
    */

    if (scope === "Purchase") {
        //verification for coupon order
        const coupon = await Coupon.findOne({ code, active: true })
        if (!coupon) {
            return null
        }
        return { couponID: coupon._id, type: coupon.type, value: coupon[coupon.type] }
    }
    const coupon = await Coupon.findOne({ code, active: true })
    if (!code || !coupon) {
        return null
    }
    const couponItems = coupon.items.map(item => { return String(item) })
    if (!couponItems.includes(String(bookID))) {
        return null
    }
    return { couponID: coupon._id, type: coupon.type, value: coupon[coupon.type] }
}
module.exports = { getCouponDetail }