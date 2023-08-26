const { StatusCodes } = require("http-status-codes")
const { Order, Book, Cart } = require("../models")
const crypto = require("crypto")

const SUCCESSFUL_CHARGE = "charge.success"

const paystackPaymentWebhook = async (req, res) => {
    const paystackToken = req.headers["x-paystack-signature"]
    const isFromPaystack = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(JSON.stringify(req.body)).digest('hex') === req.headers['x-paystack-signature']
    if (!isFromPaystack) {
        return res.status(StatusCodes.OK).json({ success: false, message: "Unknown origin", result: { paystackToken } })
    }
    const { data, event } = req.body
    if (event === SUCCESSFUL_CHARGE) {
        const order = await Order.findOne({ _id: data.metadata.orderID })
        order.transactionSuccessful = true
        order.initiated = true
        order.ref = data.ref

        for await (const item of order.orderItems) {
            item.status = "Pending"
            item.transactionSuccessful = true
            await Book.updateOne({ _id: item.productID }, { quantity: { $dec: item.quantity } })
        }
        //Make cart an archive {record active: false}
        await Cart.findOneAndUpdate({ _id: order.cartID }, { active: false })

        await order.save()
    } else {
        console.log("UNKNOWN Paystack webhook event", data, event)
    }

    return res.status(StatusCodes.OK).json({})
}


module.exports = { paystackPaymentWebhook }