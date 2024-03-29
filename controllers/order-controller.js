const { StatusCodes } = require("http-status-codes")
const { Cart, Order, User, Seller, Book } = require("../models")
const { BadRequestError, NotFoundError, Conflict, UnauthorizedError } = require("../errors")
const mongoose = require("mongoose")
const { SUPER_ROLES } = require("../config/app-data")
const { getPaymentDetails, getAccessUrl, isPaymentSuccessful } = require("../utils/paystack-utils")
const { getCouponDetail } = require("../utils/model-utils")





const createOrder = async (req, res) => {
    /*
    Creates a new order from existing cart.
    */
    const { cartID, couponCode } = req.body
    const { userID: personID } = req.params
    const { sessionID } = req.user
    if (!cartID) {
        throw new BadRequestError("Required parameter: 'cartID' is missing")
    }
    if (!personID) {
        throw new BadRequestError("Required parameter: 'personID' is missing")
    }
    const cart = await Cart.filterDeletedProd(cartID)

    if (!cart || !cart.active || cart.personID != personID) {
        throw new NotFoundError("Cart does not exist")
    }


    const user = await User.findOne({ _id: personID }).populate("addresses")
    if (!user) {
        throw new NotFoundError("User does not exist")
    }

    //Create a new Order if no uninitiated Order exists.
    const productPopulateSelect = ["name", "price", "description", "seller", "discount", "images", "shippingFee"]

    let order = await Order.findOne({ cartID, personID }).populate({ path: "orderItems.productID", select: productPopulateSelect })

    if (order) {
        await Order.findByIdAndDelete(String(order._id))
        // const newOrder = await order.save()
        // return res.status(StatusCodes.OK).json({
        //     message: "Order created", result: newOrder, success: true
        // })
    }
    //Ensure deliveryAddress or default address.
    const address = user.addresses.filter((address) => {
        return address.default
    })[0] //Get the element at index 0||undefined
    const newOrder = await new Order({ sessionID, cartID, personSchema: cart.personSchema, personID, ref: mongoose.Types.ObjectId(), deliveryAddress: address }).save()
    //Verify and apply coupon
    if (couponCode) {
        const { couponID, value, type } = await getCouponDetail({ code: couponCode, scope: "Purchase" }) || {}
        if (couponID) {
            await order.applyCoupon(couponID, value, type)
        }
    }

    res.status(StatusCodes.CREATED).json({
        message: "Order created", result: newOrder, success: true
    })
}

const updateOrder = async (req, res) => {
    const { userID: personID, addressID: deliveryAddress, couponCode, tax, initiated, deleteOrder: deleted = false } = req.body
    const { orderID } = req.params
    if (!orderID) {
        throw new BadRequestError("Missing parameter orderID")
    }
    if (!personID) {
        throw new BadRequestError("Missing parameter userID")
    }

    const order = await Order.findOne({ _id: orderID, personID }).populate("deliveryAddress")
    if (!order) {
        throw new NotFoundError("Order does not exist")
    }
    //Verify and apply coupon
    if (couponCode) {
        const { couponID, value, type } = await getCouponDetail({ code: couponCode, scope: "Purchase" }) || {}
        if (couponID) {
            await order.applyCoupon(couponID, value, type)
        }
    }

    const allowedUpdates = { deliveryAddress }
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
    const { userID: personID, onCancelRedirect } = req.body
    const { orderID } = req.params
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
    if (order.transactionSuccessful) {
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
    //Check if order has errors
    // STRICTLY FOR DEVELOPMENT PURPOSES
    if (order.orderError.length) {
        throw new Conflict("Orders cannot be completed because of the following errors: " + order.orderError.join(", "))
    }

    order.ref = new mongoose.Types.ObjectId()
    //Order has not successfully been paid for. (Re-)initiate the order where necessary.
    const metaInfo = await order.meta //get most recent meta data from Order virtuals.
    metaInfo.cancel_action = onCancelRedirect
    const { accessCode, authorizationUrl } = await getAccessUrl(order.personID.email, order.total * 100, metaInfo, order.ref)

    //Reset initiate and accessCode
    order.initiated = true
    order.transactionUrl = authorizationUrl
    await order.save()

    return res.status(StatusCodes.OK).json({ result: { accessCode, authorizationUrl }, message: "retrieved authorization email", success: true })

}

const getTransactionDetail = async (req, res) => {
    var { orderID, deleted } = req.body
    if (!orderID) {
        throw new BadRequestError("missing required parameter: orderID")
    }
    if (!SUPER_ROLES.includes(String(req.user.role).toLowerCase())) {
        deleted = false
    }

    const order = await Order.findOne({ deleted, _id: orderID })
    if (!order) {
        throw new NotFoundError("order does not exist")
    }
    const paymentDetail = await getPaymentDetails(order.ref)

    return res.status(StatusCodes.OK).json({
        message: "payment detail", success: true, result: { paymentDetail }
    })
}




/*
Order manipulation for sellers
*/

const getSellerOrders = async (req, res) => {
    var { sellerID, deletedOrder, deletedUser } = req.body
    if (!sellerID) {
        throw new BadRequestError("required param missing: sellerID")
    }
    // if (!orderID) {
    //     throw new BadRequestError("required param missing: sellerID")
    // }
    if (!SUPER_ROLES.includes(req.user.role)) {
        deletedOrder = false
        deletedUser = false
    }
    const seller = await Seller.findOne({ deleted: deletedUser, _id: sellerID })
    const sellerBooks = seller.books

    const sellerOrders = await Order.find(
        { deleted: deletedOrder, $match: { "orderItems.productID": { $in: sellerBooks } } }
    )
    res.status(StatusCodes.OK).json({ result: sellerOrders, message: "seller orders", success: true })

}
const orderUpdateStatus = async (req, res) => {
    const { orderID, productID, dispatched, trackingURL: trackingUrl, sellerID } = req.body
    const requiredParams = { orderID, productID, sellerID }

    Object.keys(requiredParams).forEach(key => {
        let value = requiredParams[key]
        if (!value) {
            throw new BadRequestError(`required param is missing: ${key}`)
        }
    })
    const book = await Book.findOne({ deleted: false, _id: productID })
    if (!book) {
        throw new BadRequestError("resource does not exist")
    }
    if (!(String(book.seller) === sellerID)) {
        throw new UnauthorizedError("seller cannot modify this resource")
    }
    const order = await Order.findOne({ _id: orderID })
    if (!order) {
        throw new NotFoundError("order does not exist")
    }

    order.orderItems.forEach(item => {
        if (String(item.productID) === productID) {
            if (dispatched && item.status === "Paid") {
                item.status = "Transit"
            }
            if (trackingUrl) {
                item.trackingUrl = trackingUrl
            }
        }
    })
    await order.save()

    return res.status(StatusCodes.OK).json({ result: order, message: "successful updated order status", success: true })
}



module.exports = { initiatePay, createOrder, getOrder, getOrders, updateOrder, getSellerOrders, orderUpdateStatus, getTransactionDetail }

