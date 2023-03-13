const jwt = require("jsonwebtoken")
const { StatusCodes } = require("http-status-codes")
const { Order, Book } = require("../models")

const SUCCESSFUL_CHARGE = "charge.success"

const paystackPaymentWebhook = async (req, res) => {
    const paystackToken = req.headers["x-paystack-signature"]
    const isFromPaystack = jwt.verify(paystackToken, process.env.PAYSTACK_SECRET_KEY, { algorithms: ["HS512"] })
    console.log("/webhooks/paystack paystackOrigin", isFromPaystack)

    if (!isFromPaystack) {
        return res.status(StatusCodes.OK).json({ success: false, message: "Unknown origin", result: { paystackToken } })
    }
    const { data, event } = req.body
    if (event === SUCCESSFUL_CHARGE) {
        const order = await Order.findOne({ ref: data.ref })
        order.transactionSuccessful = true
        order.initiated = true
        for await (const item of order.orderItems) {
            item.status = "Pending"
            item.transactionSuccessful = true

            await Book.updateOne({ _id: item.productID }, { quantity: { $dec: item.quantity } })
            console.log("Updated book: ", item.productID)
        }

        await order.save()
    } else {
        console.log("UNKNOWN Paystack webhook event", data, event)
    }

    return res.status(StatusCodes.OK).json({})
}


module.exports = { paystackPaymentWebhook }