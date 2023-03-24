const mongoose = require('mongoose');

const ReviewSchema = mongoose.Schema(
  {
    itemRating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Please provide itemRating'],
    },
    sellerRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    seller: {
      type: mongoose.Types.ObjectId,
      ref: "Seller"
    },
    title: {
      type: String,
      trim: true,
    },
    comment: {
      type: String,
    },
    person: {
      type: mongoose.Types.ObjectId,
      ref: "personSchema",
      required: [true, "Please provide the person's ID"]
    },
    personSchema: {
      type: String,
      enum: ["Seller", "User"],
      required: true
    },
    product: {
      type: mongoose.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    order: {
      type: mongoose.Types.ObjectId,
      ref: "Order"
    },
    deleted: {
      type: Boolean,
      default: false
    },
    deletedOn: {
      type: Date,
    },
    verifiedBuyer: {
      type: Boolean,
      default: false
    },
    pictures: [{
      url: String,
      uploadedAt: Date

    }], session: {
      type: mongoose.Types.ObjectId,
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
ReviewSchema.index({ product: 1, user: 1, order: 1 }, { unique: true });
ReviewSchema.index(
  {
    title: "text",
    comment: "text",
    itemRating: "text"
  },
  {
    weights: {
      itemRating: 10,
      comment: 2,
      title: 5
    }
  }
)
ReviewSchema.pre(["validate", "save"], async function checkVerifiedBuyerReview(next) {
  if (this.order) {
    //Verify order contains productID
    const order = await this.model("Order").findOne({
      transactionSuccessful: true,
      _id: this.order,
      person: this.person,
      orderItems: { $elemMatch: { productID: this.product } }
    })
    if (order) {
      this.verifiedBuyer = true
    }
  }
  return next()
})
ReviewSchema.pre(["validate", "save"], async function getSellerID(next) {
  //
  const book = await this.model("Book").findOne({ _id: this.product })
  if (book) {
    this.seller = book.seller
    console.log("SELLER FROM BOOK")

  }


  return next()
})

ReviewSchema.methods.updateSellerRating = async function () {
  if (this.verifiedBuyer && this.seller && this.sellerRating) {
    let sellerRating = { verifiedRatings: {} }
    sellerRating.verifiedRatings[String(this._id)] = this.sellerRating
    const _ = await this.model("Seller").findOneAndUpdate({ _id: this.seller, deleted: false },
      { $set: { ...sellerRating } })
    console.log(_)
  }


}

ReviewSchema.statics.calculateAverageItemRating = async function (productId) {
  const result = await this.aggregate([
    {
      $match: {
        product: productId,
        deleted: false,
        verifiedBuyer: true
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$itemRating' },
        numOfReviews: { $sum: 1 },
      },
    },
  ]);

  try {
    await this.model('Book').findOneAndUpdate(
      { _id: productId },
      {
        averageRating: result[0]?.averageRating || 0,
        numberOfVerifiedReviews: result[0]?.numOfReviews || 0,
      }
    );
  } catch (error) {
    console.log(error);
  }
};

ReviewSchema.post('save', async function () {
  await this.constructor.calculateAverageItemRating(this.product);
  await this.updateSellerRating()
});

ReviewSchema.post('remove', async function () {
  await this.constructor.calculateAverageItemRating(this.product);
});

module.exports = mongoose.model('Review', ReviewSchema);

