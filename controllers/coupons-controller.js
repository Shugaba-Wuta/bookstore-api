const { BadRequestError, Conflict, NotFoundError } = require("../errors")
const { COUPON_TYPES, SUPER_ROLES } = require("../config/app-data")
const { Coupon } = require("../models")
const { StatusCodes } = require("http-status-codes")




const createCoupon = async (req, res) => {
    const { type, percentage, flat, multipleUse, scope, itemsID: items, sellerID: createdBy, role: personSchema } = req.body

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
const getCoupons = async (req, res) => {
    var { sellerID: createdBy, code, active = true, type } = req.query
    if (!SUPER_ROLES.includes(req.user.role)) {
        active = true
        if (!createdBy) {
            throw new BadRequestError("sellerID must be provided for non-staff requests")
        }
    }
    const queryParams = {}
    if (code) {
        queryParams.code = code
    }
    if (createdBy) {
        queryParams.createdBy = createdBy
    }
    if (type) {
        queryParams.type = type
    }
    const coupons = await Coupon.find({ ...queryParams, active })
    return res.status(StatusCodes.OK).json({ result: coupons, message: "Successfully returned coupons", status: true })
}
const deleteCoupon = async (req, res) => {
    const { sellerID: createdBy } = req.body
    const { couponID } = req.param
    if (!couponID) {
        throw new BadRequestError("missing required field couponID")
    }
    if (!createdBy) {
        throw new BadRequestError("missing required field sellerID")
    }
    await Coupon.findByIdAndRemove(couponID, { active: false })
    res.status(StatusCodes.OK).json({ message: "deleted coupon", success: true, result: null })
}
const getSingleCoupon = async (req, res) => {
    const { couponID } = req.params
    var { active } = req.query
    if (!couponID) {
        throw new BadRequestError("missing required parameter")
    }
    if (!SUPER_ROLES.includes(req.user.role)) {
        active = false
    }
    const coupon = await Coupon.findOne({ active, _id: couponID })
    if (!coupon) {
        throw new NotFoundError("couponID does not match any record")
    }
    return res.status(StatusCodes.OK).json({ result: coupon, message: "Successfully returned coupon", success: true })
}



module.exports = { createCoupon, getCoupons, deleteCoupon, getSingleCoupon }