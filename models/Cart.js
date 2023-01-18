const mongoose = require("mongoose")
const mongooseHidden = require("mongoose-hidden")()

const cartItem = new mongoose.Schema({
    productID: {
        type: mongoose.Types.ObjectId,
        ref: "Book",
        required: [true, "Please provide productID. "]
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
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true
})

const cartSchema = new mongoose.Schema({
    products: {
        type: [cartItem]
    },
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
        ref: "Session"
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})


cartSchema.pre("save", async function mergeCart(next) {
    /* Middleware ensures that all items in the cart have unique productID */
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
cartSchema.pre("save", function removeZeroQuantityProducts(next) {
    this.products = this.products.filter(item => {
        return item.quantity > 0
    })
    return next()
})
cartSchema.post("save", function deleteEmptyCarts() {
    if (this.products.length < 1) {
        this.deleteOne({ _id: this._id })
    }
})
cartSchema.plugin(mongooseHidden)
module.exports = mongoose.model("Cart", cartSchema)
