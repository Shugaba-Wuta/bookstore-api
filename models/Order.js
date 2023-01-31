const mongoose = require('mongoose');
const mongooseHidden = require("mongoose-hidden")({ defaultHidden: { sessionID: true, } })

const orderStatus = ['Pending', 'Paid', "Transit", 'Delivered', 'Canceled', 'Failed']
const { cartItem } = require("./Cart")
const { DEFAULT_TAX } = require("../config/app-data")
const orderItem = new mongoose.Schema({

  status: {
    type: String,
    enum: orderStatus,
    default: 'Pending',
  },

})
orderItem.add(cartItem)


const orderSchema = new mongoose.Schema({
  cartID: {
    type: mongoose.Types.ObjectId,
    ref: "Cart",
    required: [true, "Please provide a cartID"],
    unique: true

  },
  orderItems: {
    type: [orderItem],
    required: [true, "Please provide orderItem"]
  },
  tax: {
    type: Number,
    required: true,
    default: DEFAULT_TAX,
    min: 0
  },
  personID: {
    type: mongoose.Types.ObjectId,
    required: true,
    refPath: "personSchema"
  },
  personSchema: {
    type: String,
    enum: {
      values: ["User", "Seller"],
    }
  },
  subtotal: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  sessionID: {
    type: mongoose.Types.ObjectId,
    ref: "Session",
    hide: true,
    required: [true, "Please provide a valid SessionID"]
  },
  ref: {
    type: String,
  },
  paymentConfirmed: {
    type: Boolean,
    default: false
  },
  accessCode: String
},
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

orderSchema.pre("validate", async function ensureCartPersonIsNotNull(next) {
  if (!this.personID) {
    throw new mongoose.Error(`Failed to save order:${this._id} because path: 'personID' is not set or is null`)
  }
  return next()
});

orderSchema.pre("validate", async function calculateOrderTotal(next) {
  let subtotal = 0
  let sumOfShipping = 0
  const cart = await this.model("Cart").findOne({ _id: this.cartID, person: this.personID }).populate("products.productID", ["price", "shippingFee", "discount"])
  cart.products.forEach(item => {
    this.orderItems.push(item)
    const productPrice = item.productID.price * item.quantity
    subtotal += (productPrice * (100 - Number(item.productID.discount)) / 100)
    sumOfShipping += Number(item.productID.shippingFee || 0)
  })
  this.subtotal = subtotal.toFixed(2)

  this.total = (this.subtotal * ((this.tax + 100) / 100) + sumOfShipping).toFixed(2)

  return next()
})


orderSchema.post("save", async function deleteEmptyOrders() {
  if (this.orderItems.length < 1) {

    this.deleteOne({ id: this._id })
  }
})




orderSchema.plugin(mongooseHidden)

module.exports = mongoose.model('Order', orderSchema);
