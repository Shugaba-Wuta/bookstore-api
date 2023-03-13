const mongoose = require("mongoose")
const { BadRequestError } = require("../errors")
const mongooseHidden = require("mongoose-hidden")()

const cartItem = new mongoose.Schema({
    productID: {
        type: mongoose.Types.ObjectId,
        ref: "Book",
        required: [true, "Please provide productID "]
    },
    quantity: {
        type: Number,
        min: 1,
        required: [true, "Please provide a value for product `quantity`"],
    },
    sessionID: {
        type: mongoose.Types.ObjectId,
        ref: "Session",
        required: [true, "Please provide sessionID for cart Item."]
    },
    finalPrice: {
        type: Number,
        min: 0,
        required: [true, `field finalPrice is required`]
    },
    couponValue: {
        type: Number,
        min: 0,
        default: 0
    },
    coupons: [{
        type: mongoose.Types.ObjectId,
        ref: "Coupon"
    }]
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true
})

const cartSchema = new mongoose.Schema({
    products: [cartItem]
    ,
    personID: {
        type: mongoose.Types.ObjectId,
        refPath: "personSchemaType"
    },
    personSchema: {
        type: String,
        default: "User",
        enum: {
            values: ["User", "Seller"],
            message: `personSchema values must be any of the following: ['User', 'Seller']`
        }
    },
    active: {
        type: Boolean,
        default: true,
        hide: true,
    },
    sessionID: {
        type: mongoose.Types.ObjectId,
        ref: "Session",
        hide: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

cartSchema.methods.applyCoupon = async function (couponID, value, type, productID) {
    //ensure "products.productID" has been populated
    if (!await this.populated("products.productID")) {
        await this.populate("products.productID")
    }
    const matchingProduct = this.products.filter(item => {
        return String(item.productID._id) === productID
    })
    let hasBeenApplied = matchingProduct[0].coupons ? matchingProduct[0].coupons.contains(couponID) : false
    if (!hasBeenApplied) {
        //Ensure the coupon has not been applied
        let couponValue
        if (type === "percentage") {
            const totalCost = this.products[productID].finalPrice * this.products[productID].quantity
            couponValue = (totalCost * (100 - value) / 100).toFixed(2)

        } else if (type === "flat") {
            couponValue = value
        } else {
            throw new BadRequestError(`invalid coupon type: ${type}`)
        }
        this.products[productID].coupons.push(couponID)
        //Deduct coupon value from order value
        this.products[productID].finalPrice -= couponValue
        this.products[productID].couponValue += couponValue

    }
}

cartSchema.pre("validate", async function ensureFinalPrice(next) {
    if (!await this.populated("products.productID")) {
        await this.populate("products.productID")
    }
    this.products.forEach((product) => {
        if (!product.finalPrice) {
            product.finalPrice = (product.productID.price - (100 - product.productID.discount) / 100).toFixed(2)
        }
    })
    //Depopulate
    this.depopulate("products.productID")
    next()
})
cartSchema.pre("validate", async function mergeCart(next) {

    /* Middleware ensures that all items in the cart have unique productID */
    // if (!await this.populated("products.productID")) {
    //     await this.populate("products.productID")
    // }
    const uniqueProducts = {}
    this.products.forEach(item => {
        const productID = String(item.productID)
        //If the productID already has been added
        if (Object.keys(uniqueProducts).includes(productID)) {
            //Update the quantity
            uniqueProducts[productID].quantity += item.quantity

            let createdAtDateForUpdate = new Date(item.createdAt)
            let updatedAtDateForUpdate = new Date(item.updatedAt)
            let createdAtForUniqueProd = new Date(uniqueProducts[productID].createdAt)
            let updatedAtForUniqueProd = new Date(uniqueProducts[productID].updatedAt)

            let diffCreatedAt = createdAtForUniqueProd.getTime() - createdAtDateForUpdate.getTime()
            //Get the createdAt that is far back in time, and the updatedAt that is most recent
            if (diffCreatedAt > 0) {
                uniqueProducts[productID].createdAt = createdAtDateForUpdate
                if ((updatedAtDateForUpdate.getTime() - updatedAtForUniqueProd.getTime()) > 0) {
                    uniqueProducts[productID].updatedAt = createdAtForUniqueProd
                    uniqueProducts[productID].sessionID = item.sessionID
                }
            } else {
                if ((updatedAtDateForUpdate.getTime() - updatedAtForUniqueProd.getTime()) > 0) {
                    uniqueProducts[productID].updatedAt = createdAtDateForUpdate
                    uniqueProducts[productID].sessionID = item.sessionID
                }
            }
        } else {
            uniqueProducts[productID] = item
        }
    })
    /*Convert uniqueProducts back to an array of cartItems.*/
    //Overrides the products to be an empty array
    this.products =
        Object.keys(uniqueProducts).map(prod => {
            return {
                productID: prod,
                ...uniqueProducts[prod]
            }
        })
    next()


})
cartSchema.pre("validate", function removeZeroQuantityProducts(next) {
    this.products = this.products.filter(item => {
        return item.quantity > 0
    })
    return next()
})
cartSchema.post("save", function deleteEmptyCarts() {
    if (this.products.length < 1) {
        this.deleteOne({ _id: this._id })
        throw new mongoose.Error("cart must contain more than one item")

    }
})


cartSchema.plugin(mongooseHidden)
module.exports = { Cart: mongoose.model("Cart", cartSchema), cartItem }
