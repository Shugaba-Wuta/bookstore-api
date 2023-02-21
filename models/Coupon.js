const mongoose = require("mongoose")
const { DEFAULT_COMMISSION, DEFAULT_TAX } = require("../config/app-data")
const { BadRequestError } = require("../errors")
const scope = ["Purchase", "Book"]
const COUPON_TYPES = ["flat", "percentage"]



const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        trim: true,
        required: true,
    },
    type: {
        type: String,
        enum: {
            values: COUPON_TYPES,
            message: `type must be any of the following values: ${COUPON_TYPES}`
        },
        required: [true, "coupon `type` is a required field"]
    },
    percentage: {
        type: Number,
        min: 0,
        max: 99,
    },
    flat: {
        type: Number,
        min: 0
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
    items: {
        type: [mongoose.Types.ObjectId],
        ref: "Book"
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        refPath: "personSchemaType"
    },
    personSchema: {
        type: String,
        default: "Seller",
        enum: {
            values: ["Seller", "Staff"],
            message: `Values must be any of the following: ['Staff', 'Seller']`
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})
couponSchema.virtual("carts", {
    localField: "_id",
    foreignField: "coupon",
    ref: "Cart"

})
couponSchema.virtual("orders", {
    localField: "_id",
    foreignField: "coupon",
    ref: "Order"
})
couponSchema.pre("validate", function () {
    if ((!this.percentage && !this.flat) || (this.percentage && this.percentage)) {
        throw new BadRequestError(`coupon must be either of the following: ${COUPON_TYPES}`)
    }
    if (this.scope === "Book") {
        if (!this.items) {
            throw new BadRequestError("items cannot be empty for this scope of Coupon")
        }
    } else if (this.scope === "Order") {
        // Coupon.scope === Order: should not exceed the tax and commission, so as not to impede seller's share of book.
        //For deals that seller agrees that admin cuts his/her final share in coupons, use Coupon.scope === "Book".
        if (this.percentage && this.percentage >= (DEFAULT_COMMISSION + DEFAULT_TAX)) {
            throw new BadRequestError(`Coupon of scope ${this.scope}, requires that percentage settlement is less than ${DEFAULT_COMMISSION + DEFAULT_TAX}`)
        }
    }

})

module.exports = mongoose.model("Coupon", couponSchema)