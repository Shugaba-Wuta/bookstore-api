const { StatusCodes } = require("http-status-codes")
const { Cart, Order } = require("../models")
const { UnauthenticatedError, BadRequestError, NotFoundError } = require("../errors")




const initiatePay = async (req, res) => {

    const { cartID } = req.params
    const { userID: personID, sessionID } = req.user
    if (!personID) {
        throw new UnauthenticatedError("Please login to checkout")
    }
    if (!cartID) {
        throw new BadRequestError("Required parameter: 'cartID' is missing")
    }


    let cart = await Cart.findOne({ _id: cartID, active: true, personID }).populate("products.productID")

    if (!cart) {
        throw new NotFoundError(`Cannot find cart belonging to this user`)
    }
    //Create a new Order.
    const order = new Order({ sessionID, cartID, personSchema: cart.personSchema, personID: cart.personID })
    let subtotal = 0
    cart.products.forEach(item => {
        order.orderItems.push(item)
        subtotal += item.productID.price * item.quantity
    })
    order.subtotal = subtotal

    if (order.tax > 0) {
        order.total = order.subtotal * (1 + (order.tax / 100))
    } else {
        order.total = order.subtotal
    }

    const saveOrders = await (await order.save()).populate("orderItems.productID")










    res.status(StatusCodes.OK).json({ result: saveOrders, msg: "Successfully initiated pay. Returned " })

}








module.exports = { initiatePay }