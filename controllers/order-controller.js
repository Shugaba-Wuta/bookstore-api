const { StatusCodes } = require("http-status-codes")
const { Cart, Order, User } = require("../models")
const { BadRequestError, NotFoundError, Conflict } = require("../errors")
const mongoose = require("mongoose")
const { SUPER_ROLES } = require("../config/app-data")
const { isPaymentSuccessful, getAccessUrl } = require("../utils/paystack-utils")





const createOrder = async (req, res) => {
    /*
    Creates a new order from existing cart.
    */
    const { cartID, userID: personID } = req.body
    const { sessionID } = req.user
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

    let order = await Order.findOne({ cartID, personID }).populate("orderItems.productID", productPopulateSelect)

    if (order) {
        throw new BadRequestError("Order already exists, consider updating order")
    }
    //Ensure deliveryAddress or default address.
    const address = user.addresses.filter((address) => {
        return address.default
    })
    const newOrder = await new Order({ sessionID, cartID, personSchema: cart.personSchema, personID, ref: mongoose.Types.ObjectId(), deliveryAddress: address }).save()

    res.status(StatusCodes.CREATED).json({
        message: "Order created", result: newOrder, success: true
    })
}

const updateOrder = async (req, res) => {
    //TODO: Add an activity logger function.

    const { orderID, userID: personID, addressID: deliveryAddress, coupon, tax, initiated, deleteOrder: deleted = false } = req.body
    if (!orderID) {
        throw new BadRequestError("Missing parameter orderID")
    }
    if (!personID) {
        throw new BadRequestError("Missing parameter userID")
    }

    const order = await Order.findOne({ _id: orderID, personID, deleted }).populate("deliveryAddress")
    if (!order) {
        throw new NotFoundError("Order does not exist")
    }

    const allowedUpdates = { deliveryAddress, coupon }
    const escalatedUpdates = { tax, initiated, deleted }
    //Generic updates
    Object.keys(allowedUpdates).forEach(item => {
        if (allowedUpdates[item]) {
            order[item] = allowedUpdates[item]
        }
    })

    //escalated account updates
    if (SUPER_ROLES.includes(String(req.user.role).toLowerCase()))
        Object.keys(escalatedUpdates).forEach(item => {
            if (escalatedUpdates[item]) {
                order[item] = escalatedUpdates[item]
            }
            if (item === "deleted") {
                order.deleted = escalatedUpdates["deleted"]
                order.deletedOn = Date.now()
            }
        })

    const newOrder = await order.save()

    res.status(StatusCodes.OK).json({ message: "update successful", success: true, result: newOrder })


}

const getOrder = async (req, res) => {
    const { orderID } = req.params
    var { deleted = false } = req.query
    if (!orderID) {
        throw new BadRequestError("Missing field: orderID")
    }
    if (!SUPER_ROLES.includes(String(req.user.role).toLowerCase())) {
        deleted = false
    }
    const order = await Order.findOne({ _id: orderID, deleted }).populate(["deliveryAddress", "orderItems.productID"])
    if (!order) {
        throw new NotFoundError("Order does not exist")
    }
    res.status(StatusCodes.OK).json({ message: "order returned", success: true, result: order })
}

const getOrders = async (req, res) => {
    const { userID: personID } = req.params
    var { deleted = false } = req.query

    if (!SUPER_ROLES.includes(String(req.user.role).toLowerCase())) {
        deleted = false
    }
    const orders = await Order.find({ personID, deleted }).populate(["deliveryAddress", "orderItems.productID"])
    res.status(StatusCodes.OK).json({ message: "orders returned", success: true, result: orders })
}


const initiatePay = async (req, res) => {
    const { userID: personID, orderID, onCancelRedirect } = req.body
    if (!personID) {
        throw new BadRequestError("missing required body: userID")
    }
    if (!orderID) {
        throw new BadRequestError("missing required body: orderID")
    }
    if (!onCancelRedirect) {
        throw new BadRequestError("missing required body: onCancelRedirect")
    }

    const order = await Order.findOne({ _id: orderID, personID, deleted: false }).populate('personID')

    if (!order) {
        throw new NotFoundError("order not found")
    }
    if (!order.transactionSuccessful) {
        throw new Conflict("order has been paid successfully")
    }
    if (order.initiated) {
        //confirm the status of the transaction
        const paymentSuccessful = await isPaymentSuccessful(order.ref)
        if (paymentSuccessful) {
            throw new Conflict("order has been paid successfully")
        }
        order.prevRef.push(order.ref)
    }
    order.ref = new mongoose.Types.ObjectId()
    //Order has not successfully been paid for. (Re-)initiate the order where necessary.
    const metaInfo = await order.meta //get most recent meta data from Order virtuals.
    metaInfo.cancel_action = onCancelRedirect
    const { accessCode, authorizationUrl } = await getAccessUrl(order.personID.email, order.total * 100, metaInfo, order.ref)

    //Reset initiate and accessCode
    order.initiated = true
    order.transactionUrl = authorizationUrl

    return res.status(StatusCodes.OK).json({ result: { accessCode, authorizationUrl }, message: "retrieved authorization email", success: true })

}







module.exports = { initiatePay, createOrder, getOrder, getOrders, updateOrder, }

