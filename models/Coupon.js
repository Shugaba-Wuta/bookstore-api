const mongoose = require("mongoose")
const scope = ["Purchase", "Book"]



const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        trim: true,
        required: true,
    },
    discount: {
        type: Number,
        required: [true, "Please provide discount percentage"],
        min: 0,
        max: 100,
    },
    active: {
        type: Boolean,
        default: true,
    },
    multipleUse: {
        type: Boolean,
        default: false
    },
    scope: {
        default: "Book",
        type: String,
        trim: true,
        enum: {
            values: scope,
            message: `Please provide scope for coupon usage. Choose any of the following: ${scope}`
        }
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        refPath: "personSchemaType"
    },
    personSchema: {
        type: String,
        default: "User",
        enum: {
            values: ["User", "Seller", "Admin"],
            message: `Values must be any of the following: ['User', 'Seller']`
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})


module.exports = mongoose.model("Coupon", couponSchema)