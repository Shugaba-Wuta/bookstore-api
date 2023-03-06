const { StatusCodes } = require("http-status-codes")
const { Cart, Order, BankAccount, User } = require("../models")
const { UnauthenticatedError, BadRequestError, NotFoundError, UnauthorizedError, CustomAPIError, Conflict } = require("../errors")
const mongoose = require("mongoose")
const { addOrDecreaseProductQuantity } = require("../utils/generic-utils")
const { paystackInitiateDynamicMultiSplit } = require("../utils/paystack-utils")




const generateOrderSummary = async (req, res) => {
    /* Create a new order using cartID. Compute the totals
const createOrderSummary = async (req, res) => {
    /* Creates a new order using cartID.
    */
    const { cartID } = req.body
    const { sessionID, userID: personID } = req.user
    if (!cartID) {
        throw new BadRequestError("Required parameter: 'cartID' is missing")
    }
    if (!personID) {
        throw new BadRequestError("Required parameter: 'personID' is missing")
    }
    const cart = await Cart.findOne({
        _id: cartID, active: true, personID
    }).populate("products.productID")
    if (!cart) {
        throw new NotFoundError("Cart does not exist")
    }


    const user = await User.findOne({ _id: personID }).populate("addresses")
    if (!user) {
        throw new NotFoundError("User does not exist")
    }

    //Create a new Order if no uninitiated Order exists.
    const productPopulateSelect = ["name", "price", "description", "seller", "discount", "images", "shippingFee"]

    let order = await Order.findOne({ cartID, personID }) //.populate("orderItems.productID", productPopulateSelect)

    if (order) {
        throw new BadRequestError("Order already exists, consider updating order")
    }
    //Ensure deliveryAddress or default address.
    const address = user.addresses.filter((address) => {
        return address.default
    })
    const newOrder = await new Order({ sessionID, cartID, personSchema: cart.personSchema, personID, ref: mongoose.Types.ObjectId(), deliveryAddress: address }).save().populate("orderItems.productID", productPopulateSelect)

    res.status(StatusCodes.OK).json({
        message: "Order created", result: newOrder, success: true
    })
}


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

    const cart = await Cart.findOne({ _id: cartID, active: true, personID }).populate("products.productID")
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

    const meta = order.meta
    console.log(meta.splitPayDetails)
    const initiateResponse = await paystackInitiateDynamicMultiSplit(user.email, Math.ceil(order.total * 100), meta.splitPayDetails, order.ref, meta)
    if (!initiateResponse.data)
        throw new CustomAPIError(`The following error occurred while initiating transaction: ${initiateResponse.message}`)

    //Modify fields after successful request is sent.
    order.accessCode = initiateResponse.data.access_code
    // order.initiated = true
    await order.save()

    //Remove quantity from stock.
    // await addOrDecreaseProductQuantity(productQuantity, "increment")

    //Prepare response with authorizationURL
    const { authorization_url: authorizationURL, access_code: accessCode, } = initiateResponse.data
    res.status(StatusCodes.OK).json({
        result: {
            authorizationURL, accessCode
        },
        msg: initiateResponse.message,
        success: initiateResponse.status
    })


}




const initiatePay2 = async (req, res) => {
    const { personID } = req.body
    const { orderID } = req.params


    if (!orderID) {
        throw new BadRequestError("orderID is missing")
    }
    if (!personID) {
        throw new BadRequestError("personID is missing")
    }
    const order = await Order.findOne({ _id: orderID, transactionSuccessful: false, personID: personID })

    if (!order) {
        throw new NotFoundError("Cannot checkout this order")
    }
    if (!order.initiated) {
        //Order has never been initiated.
        console.log("\n\n\nNEW ORDER")
    } else {
        //Order has been initiated but it is still unsuccessful.
        console.log("\n\n\nRE-INITIATED ORDER")

    }

}







module.exports = { initiatePay, initiatePay2, createOrderSummary }

