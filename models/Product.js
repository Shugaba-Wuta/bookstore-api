const mongoose = require('mongoose');
const { PRODUCT_DEPARTMENTS } = require("../config-data")

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a product name"],
      maxLength: [128, "Product name should not exceed 128 characters"],
      minLength: [4, "Product name should be more than 4 characters"],
      trim: true
    },
    description: {
      type: Array,
      required: [true, "Please provide a product description"],
      minLength: [10, "Product description should be more than 10 characters"],
      trim: true
    },
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
      default: "book"
    },
    owner: {
      type: mongoose.Types.ObjectId,
      required: [true, "Please provide owner of this product"],
      ref: "User"
    },
    price: {
      type: Number,
      required: [true, "Please provide a price for product"]
    },
    discount: {
      type: Number,
      default: 0
    },
    featured: {
      type: Boolean,
      default: false
    },
    freeShipping: {
      type: Boolean,
      default: false,
    },
    tags: [String],
    commission: {
      type: Number,
      default: 15,
    },
    location: {
      type: mongoose.Types.ObjectId,
      ref: "Address",
    },
    deleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

ProductSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
  justOne: false,
});



ProductSchema.virtual('image', {
  ref: 'Image',
  localField: '_id',
  foreignField: 'product',
  justOne: false,
});


ProductSchema.pre("save", async function (next) {
  //make all the tags lower case for easy search
  this.tags = this.tags.map((tag) => {
    return tag.trim().toLowerCase()
  })

})

ProductSchema.pre('remove', async function (next) {
  await this.model('Review').deleteMany({ product: this._id });
});


module.exports = mongoose.model('Product', ProductSchema, { discriminatorKey: "kind" });
