const mongoose = require('mongoose');
const mongooseHidden = require("mongoose-hidden")()

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


const orderSchema = new mongoose.Schema(
  {
    cartID: {
      type: mongoose.Types.ObjectId,
      ref: "Cart",
      required: [true, "Please provide a cartID"]
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
    clientSecret: {
      type: String,
      // required: true,
      hide: true
    },
    paymentIntentId: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

orderSchema.pre("save", async function ensureCartPersonIsNotNull(next) {
  if (!this.personID) {
    throw new mongoose.Error(`Failed to save order:${this._id} because path: 'personID' is not set or is null`)
  }
  return next()
})

orderSchema.post("save", async function deleteEmptyOrders() {
  if (this.orderItems.length < 1) {

    this.deleteOne({ id: this._id })
  }
})




orderSchema.plugin(mongooseHidden)

module.exports = mongoose.model('Order', orderSchema);
