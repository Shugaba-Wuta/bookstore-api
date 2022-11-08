const mongoose = require('mongoose');

const orderStatus = ['pending', 'failed', 'paid', 'delivered', 'canceled']


const OrderSchema = mongoose.Schema(
  {
    tax: {
      type: Number,
      required: true,
      default: 10
    },
    shippingFee: {
      type: Number,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    orderItems: {
      type: [mongoose.Types.ObjectId],
      ref: "Product"
    },
    status: {
      type: String,
      enum: orderStatus,
      default: 'pending',
    },
    person: {
      type: mongoose.Types.ObjectId,
      ref: "personSchemaType",
      required: [true, "Please provide the person's ID"]
    },
    personSchemaType: {
      type: String,
      enum: ["Seller", "User"],
      required: true
    },
    sessionID: {
      type: mongoose.Schema.ObjectId,
      ref: "Session",
      required: [true, "Please provide a valid SessionID"]
    },
    clientSecret: {
      type: String,
      required: true,
    },
    paymentIntentId: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);
