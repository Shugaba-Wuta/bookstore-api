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
  coupon: { type: mongoose.Types.ObjectId, ref: "Coupon" },
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

orderSchema.virtual("meta").get(async function () {
  const splitPayDetails = []
  const productQuantity = []
  // await this.populate("orderItems.productID")
  for await (const item of this.orderItems) {
    const { subaccount } = await this.model("BankAccount").findOne({ deleted: false, default: true, person: item.productID.seller })
    const discountedUnitPrice = item.productID.price * ((100 - item.productID.discount) / 100)
    const shareInNaira = (discountedUnitPrice * item.quantity + item.productID.discount).toFixed(2)
    splitPayDetails.push({ subaccount, share: shareInNaira * 100 })
    //Add the quantity and productID to productQuantity
    productQuantity.push({ productID: String(item.productID._id), quantity: item.quantity })
  }
  console.log(splitPayDetails)
  return { splitPayDetails, productQuantity, }

})

orderSchema.pre("validate", async function ensureCartPersonIsNotNull(next) {
  if (!this.personID) {
    throw new mongoose.Error(`Failed to save order:${this._id} because path: 'personID' is not set or is null`)
  }
  return next()
});

orderSchema.pre("validate", async function calculateOrderTotal(next) {
  let subtotal = 0
  let couponValue = 0
  await this.populate("coupon")
  await this.populate("orderItems.productID")
  const cart = await this.model("Cart").findOne({ _id: this.cartID, person: this.personID })
  for (const item of cart.products) {
    this.orderItems.push(item)
    subtotal += item.finalPrice

    if (!this.coupon) {
      continue
    }
    const coupon = await item.coupon.populate("orders")
    if (coupon.orders.includes(this._id)) {
      //Skip because coupon can only be applied once.
      continue
    }
    if (this.coupon.items.includes(item.productID._id)) {
      //Apply coupon to Coupon.scope === "Book" that is specific to books.
      if (item.coupon.flat) {
        couponValue = item.coupon.flat
      } else {
        //coupon is of type percentage
        couponValue = item.productID.price * ((100 - item.coupon.percentage) / 100) * item.quantity
      }
      //adjust the subtotal and finalPrice after adding a coupon on a product
      subtotal -= item.finalPrice
      item.finalPrice -= couponValue
      subtotal += item.finalPrice

    } else if (this.coupon.type === "ORDER") {
      //Apply coupon to entire cart subtotal, limit this coupon to <= (COMMISSION + TAX) so that sellers share is not affected.
      if (item.coupon.flat) {
        couponValue = item.coupon.flat
        const couponMaxValue = ((DEFAULT_TAX + DEFAULT_COMMISSION) / 100) * subtotal
        if (couponValue > couponMaxValue) {
          throw new Conflict(`Amount cannot be settled because coupon exceeds limit of: ${couponMaxValue}`)
        }
      } else {
        //coupon is of type percentage
        couponValue = item.productID.price * ((100 - item.coupon.percentage) / 100) * item.quantity
      }
      //adjust the subtotal and finalPrice after adding a coupon on a product
      subtotal -= item.finalPrice
      item.finalPrice -= couponValue
      subtotal += item.finalPrice
      subtotal = (subtotal - couponValue)
    }


  }
  this.subtotal = subtotal.toFixed(2)
  this.total = (this.subtotal * ((this.tax + 100) / 100))

  return next()
})


orderSchema.post("save", async function deleteEmptyOrders() {
  if (this.orderItems.length < 1) {

    this.deleteOne({ id: this._id })
  }
})



orderSchema.plugin(mongooseHidden)

module.exports = mongoose.model('Order', orderSchema);
