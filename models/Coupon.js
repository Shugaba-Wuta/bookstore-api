const mongoose = require("mongoose")
const { DEFAULT_COMMISSION, DEFAULT_TAX } = require("../config/app-data")
const { BadRequestError, Conflict } = require("../errors")
const scope = ["Purchase", "Book"]
const { COUPON_TYPES } = require("../config/app-data")



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
    items: [{
        type: mongoose.Types.ObjectId,
        ref: "Book"
    }],
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
    foreignField: "coupons",
    ref: "Cart"

})
couponSchema.virtual("orders", {
    localField: "_id",
    foreignField: "coupons",
    ref: "Order"
})
couponSchema.static("createCouponCode", function () {
    return Math.random().toString(36).substring(3, 12).toUpperCase()
})
couponSchema.pre("validate", function changePersonSchemaToTitleCase(next) {
    if (this.personSchema)
        this.personSchema = String(this.personSchema)[0].toUpperCase() + String(this.personSchema).slice(1).toLowerCase()
    next()
})
couponSchema.pre("validate", function ensureRoleMatchScope(next) {
    //Ensure that seller cannot create coupon for Order
    if ((this.personSchema !== "Staff") && (this.scope === "Purchase")) {
        throw new Conflict(this.personSchema + " cannot create coupon of scope Purchase")
    }
    return next()
})
couponSchema.pre("validate", function ensureValueMatchType() {
    if (!this[this.type])
        throw new Conflict("Coupon must have value for" + this.type)
})
couponSchema.pre("validate", async function ensureUserOwnsResource(next) {
    if (this.personSchema !== "Staff") {
        //A seller can only create one coupon for one item
        if (this.items.length > 1) {
            throw new BadRequestError("This account cannot create coupon for multiple items")
        }
        let book = await this.model("Book").find({ seller: this.createdBy, _id: this.items[0], deleted: false })
        if (!book) {
            throw new Conflict("Account does not own this product")
        }
    }
    return next()
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