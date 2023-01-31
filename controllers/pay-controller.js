const { StatusCodes } = require("http-status-codes")
const { Cart, Order, BankAccount, User } = require("../models")
const { UnauthenticatedError, BadRequestError, NotFoundError, UnauthorizedError, CustomAPIError, Conflict } = require("../errors")
const mongoose = require("mongoose")
const { paystackInitiateDynamicMultiSplit } = require("../utils/paystack-utils")




const initiatePay = async (req, res) => {
    /*Receives user identifier, cart identifier and requests payment URL for the products in the carts.
    This functionality is only accessible to the users. Admin/ Staff cannot initiatePay on behalf of user.
    */

    const { cartID } = req.params
    const { userID: personID, sessionID } = req.user
    if (!personID) {
        throw new UnauthenticatedError("Please login to checkout")
    }
    const user = await User.findOne({ _id: personID })
    if (!user) {
        throw new NotFoundError("User does not exist")
    }
    if (!user.verifiedEmail) {
        throw new UnauthorizedError("User's email must be verified")
    }
    if (!cartID) {
        throw new BadRequestError("Required parameter: 'cartID' is missing")
    }


    let cart = await Cart.findOne({ _id: cartID, active: true, personID }).populate("products.productID")

    if (!cart) {
        throw new NotFoundError(`Cannot find cart belonging to this user`)
    }
    //Create a new Order if no uninitiated Order exists.
    const productPopulateSelect = ["name", "price", "description", "seller", "discount", "images", "shippingFee"]
    let order = await Order.findOne({ cartID, personID }).populate("orderItems.productID", productPopulateSelect)

    if (!order) {
        order = await new Order({ sessionID, cartID, personSchema: cart.personSchema, personID, ref: mongoose.Types.ObjectId() }).save()
        await order.populate("orderItems.productID", productPopulateSelect)
    }
    if (order.initiated) {
        throw new Conflict("Checkout has been initiated. Consider verifying the status")
    }

    const splitPayDetails = []

    for await (const item of order.orderItems) {
        const { subaccount } = await BankAccount.findOne({ deleted: false, default: true, person: item.productID.seller })
        const discountedUnitPrice = item.productID.price * ((100 - item.productID.discount) / 100)

        const shareInNaira = (discountedUnitPrice * item.quantity + item.productID.shippingFee).toFixed(2)
        splitPayDetails.push({ subaccount, share: shareInNaira * 100 })
    }
    const initiateResponse = await paystackInitiateDynamicMultiSplit(user.email, Math.ceil(order.total * 100), splitPayDetails, order.ref)
    if (!initiateResponse.data)
        throw new CustomAPIError(`The following error occurred while initiating transaction: ${initiateResponse.message}`)
    order.accessCode = initiateResponse.data.access_code
    order.initiated = true
    await order.save()
    const { authorization_url: authorizationURL, access_code: accessCode, } = initiateResponse.data





    res.status(StatusCodes.OK).json({
        result: {
            authorizationURL, accessCode
        },
        msg: initiateResponse.message,
        success: initiateResponse.status
    })

}








module.exports = { initiatePay }