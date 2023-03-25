const { BadRequestError, Conflict } = require("../errors")
const { COUPON_TYPES } = require("../config/app-data")
const { Coupon } = require("../models")
const { StatusCodes } = require("http-status-codes")




const createCoupon = async (req, res) => {
    const { type, percentage, flat, multipleUse, scope, itemsID: items, userID: createdBy, role: personSchema } = req.body

    const requiredFields = { type, multipleUse, scope, createdBy, personSchema }
    const err = []
    //Check for incomplete request body
    Object.keys(requiredFields).forEach(item => {
        if (!requiredFields[item] && !(requiredFields[item] instanceof Boolean)) {
            //
            err.append(`missing required fields: ${item}`)
        }
    })
    if (err.length) {
        throw new BadRequestError(err.join(", "))
    }
    if (!COUPON_TYPES.includes(type)) {
        throw new BadRequestError("invalid value for type: possible values: ", COUPON_TYPES)
    }
    if (flat && percentage) {
        throw new Conflict("coupon can not be both flat and percentage")
    }
    if (!flat && !percentage) {
        throw new BadRequestError("provide value for either: flat or percentage")
    }
    const code = Coupon.createCouponCode()
    const coupon = await new Coupon({ ...requiredFields, code, items, flat, percentage }).save()

    res.status(StatusCodes.CREATED).json({ message: "Successfully created coupon", result: coupon, success: true })
}
const getCoupon = async (req, res) => { }
const deleteCoupon = async (req, res) => { }



module.exports = { createCoupon, getCoupon, deleteCoupon }