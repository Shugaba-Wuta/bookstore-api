const mongoose = require("mongoose")

const cartItem = new mongoose.Schema({
    productID: {
        type: mongoose.Types.ObjectId,
        ref: "Product",
        required: [true, "Please provide productID"]
    },
    quantity: {
        type: Number,
        min: 1,
        default: 1
    },
    sessionID: {
        type: mongoose.Types.ObjectId,
        ref: "Session",
        required: [true, "Please provide sessionID for cart Item"]
    },
    coupon: {
        type: mongoose.Types.ObjectId,
        ref: "Coupon"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
})
cartItem.index({ productID: 1, sessionID: 1 }, { unique: true })

const cartSchema = new mongoose.Schema({
    products: {
        type: [cartItem],
    },
    person: {
        type: mongoose.Types.ObjectId,
        refPath: "personSchemaType"
    },
    personSchema: {
        type: String,
        default: "User",
        enum: {
            values: ["User", "Seller"],
            message: `Values must be any of the following: ['User', 'Seller']`
        }
    },
    active: {
        type: Boolean,
        default: true
    },
    sessionID: {
        type: mongoose.Types.ObjectId,
        ref: "Session"
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

module.exports = mongoose.model("Cart", cartSchema)