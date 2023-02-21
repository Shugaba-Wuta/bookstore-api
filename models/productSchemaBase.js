const mongoose = require('mongoose');
const mongooseHidden = require("mongoose-hidden")()
const { PRODUCT_DEPARTMENTS } = require("../config/app-data")
const { DEFAULT_COMMISSION } = require("../config/app-data")

const productBaseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a product name"],
      maxLength: [256, "Product name should not exceed 256 characters"],
      minLength: [1, "Product name should be more than 4 characters"],
      trim: true
    },
    description: {
      type: String,
      required: [true, "Please provide a product description"],
      trim: true
    },
    images: [{
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    inventory: {
      type: Number,
      min: 0,
      default: 0
    },
    department: {
      type: String,
      required: [true, "Please provide a Department for product"],
      enum: {
        values: PRODUCT_DEPARTMENTS,
        message: `Product must belong to any of the following department: ${PRODUCT_DEPARTMENTS}`
      },
      default: "Books"
    },
    seller: {
      type: mongoose.Types.ObjectId,
      required: [true, "Please provide owner of this product"],
      ref: "Seller"
    },
    price: {
      type: Number,
      min: 0,
      required: [true, "Please provide a price for product"]
    },
    currency: {
      type: String,
      default: "NGN"
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    featured: {
      type: Boolean,
      default: false
    },

    tags: [String],
    commission: {
      type: Number,
      hide: true,
      default: DEFAULT_COMMISSION,
    },
    deleted: {
      type: Boolean,
      default: false,
      hide: true,
    },
    deletedOn: {
      hide: true,
      type: Date
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

productBaseSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
  justOne: false,
});





productBaseSchema.pre('remove', async function (next) {
  await this.model('Review').deleteMany({ product: this._id });
  next()
});
productBaseSchema.plugin(mongooseHidden)


module.exports = productBaseSchema;

