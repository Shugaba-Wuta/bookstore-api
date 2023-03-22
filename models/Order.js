const mongoose = require('mongoose');
const mongooseHidden = require("mongoose-hidden")({ defaultHidden: { sessionID: true, } })

const orderStatus = ['Pending', 'Paid', "Transit", 'Delivered', 'Failed']
const { cartItem } = require("./Cart")
const { DEFAULT_TAX, DEFAULT_COMMISSION } = require("../config/app-data");
const { Conflict } = require('../errors');
const orderItem = new mongoose.Schema({


  status: {
    type: String,
    enum: orderStatus,
    default: 'Pending',
  },
  trackingUrl: {
    type: String,
    trim: true
  }

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
  initiated: {
    type: Boolean,
    default: false
  },
  transactionSuccessful: {
    type: Boolean,
    default: false
  },
  transactionUrl: String,
  coupons: [{ type: mongoose.Types.ObjectId, ref: "Coupon" }],
  couponValue: { type: Number, min: 0, default: 0 },
  deliveryAddress: {
    type: mongoose.Types.ObjectId,
    ref: "Address"
  },
  prevRef: { type: [String] },
  deleted: { type: Boolean, default: false },
  deletedOn: { type: Date }
},
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  })
orderSchema.methods.applyCoupon = async function (couponID, value, type) {
  if (this.coupons.includes(String(couponID)) || this.coupons.includes(mongoose.Types.ObjectId(couponID))) {
    return
  }
  const subtotal = this.orderItems.map(item => {
    return item.finalPrice
  }).reduce((sum, val) => { return sum + val, 0 })
  let couponValue
  if (type === "percentage") {
    couponValue = (subtotal * (value / 100)).toFixed(2)

  } else {
    couponValue = subtotal - value
  }
  //Check that the couponValue is not more than the commission charged by the platform
  if (!couponValue < (subtotal * (DEFAULT_COMMISSION / 100))) {
    throw new Conflict("Coupon cannot be applied")
  }
  this.couponValue = couponValue
  this.coupons.push(couponID)

}
orderSchema.virtual("meta").get(async function () {
  const splitPayDetails = []
  const productQuantity = []
  if (!this.orderItems.seller) {
    //Check if the path: orderItems.productID has been populated
    await this.populate("orderItems.productID")
  }
  for await (const item of this.orderItems) {
    //Get default account detail for seller
    const { subaccount } = await this.model("BankAccount").findOne({ deleted: false, default: true, person: String(item.productID.seller) })

    splitPayDetails.push({ subaccount, share: (item.finalPrice).toFixed(2) * 100 })
    //Add the quantity and productID to productQuantity
    productQuantity.push({ productID: String(item.productID._id), quantity: item.quantity })
  }
  return { splitPayDetails, productQuantity, orderID: String(this._id) }

})
orderSchema.pre("validate", async function (next) {
  const cart = await this.model("Cart").findOne({ _id: this.cartID, person: this.personID }).lean()
  const orderItemsID = new Set(this.orderItems.map(item => { return String(item.productID._id) }))
  cart.products.forEach((item) => {
    if (!orderItemsID.has(String(item.productID))) {
      this.orderItems.push({ ...item, createdAt: Date.now(), updatedAt: Date.now() })
      orderItemsID.add(String(item.productID))
    }
  })


  return next()
})

orderSchema.pre("validate", async function ensureCartPersonIsNotNull(next) {
  if (!this.personID) {
    throw new mongoose.Error(`Failed to save order:${this._id} because path: 'personID' is not set or is null`)
  }
  return next()
});

orderSchema.pre(["validate", "update"], async function calculateOrderTotal(next) {
  const subtotal = this.orderItems.map(item => {
    return item.finalPrice
  }).reduce((sum, val) => { return sum + val }, 0)
  this.subtotal = (subtotal - this.couponValue)
  this.total = (this.subtotal * (DEFAULT_COMMISSION + 100) / 100 + ((this.tax) / 100 * this.subtotal)).toFixed(2)
  return next()
})


orderSchema.post("save", async function deleteEmptyOrders() {
  if (this.orderItems.length < 1) {
    this.deleteOne({ id: this._id })
  }
})



orderSchema.plugin(mongooseHidden)

module.exports = mongoose.model('Order', orderSchema);
