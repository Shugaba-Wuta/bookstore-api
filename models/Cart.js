const mongoose = require("mongoose")
const { bookCoverType } = require("./Book")



const cartSchema = new mongoose.Schema({
    productID: {
        type: mongoose.Types.ObjectId,
        ref: "Product",
        required: [true, "Please provide productID"]
    },
    bookCoverType: {
        type: String,
        required: [true, "Please provide the bookCoverType to add product to cart"],
        enum: {
            values: bookCoverType,
            message: `Please provide a book cover type from any of the following values ${bookCoverType}`
        }
    },
    sessionID: {
        type: mongoose.Types.ObjectId,
        ref: "Session",
        required: [true, "Please provide sessionID"]
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

module.exports = mongoose.model("Cart", cartSchema)