const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');


const ROLES = ["user", "publisher", "author", "seller",]
const GENDER = ["M", "F", null]

const userSchema = new mongoose.Schema({
  name: {

    first: {
      type: String, minLength: 2, maxLength: 64,
      required: [true, "Please provide a first name"]
    },
    middle: {
      type: String
    },
    last: {
      type: String, minLength: 2, maxLength: 64,
      required: [true, "Please provide a last name"]
    }

  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Please provide email'],
    validate: {
      validator: validator.isEmail,
      message: 'Please provide valid email',
    }
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 8,
  },

  gender: {
    type: String,
    enum: GENDER
  },

  avatar: {
    // type: [documentSchema],
    type: mongoose.Types.ObjectId,
    ref: "Document"
  },

  role: {
    type: String,
    enum: {
      values: ROLES,
      message: `Role must be either of the following: ${ROLES}`
    },
    default: "user"
  },

  active: {
    type: Boolean,
    default: true
  },

  verified: {
    type: Boolean,
    default: false,
  },
  address: {
    type: mongoose.Types.ObjectId,
    ref: "Adress"
  },
  order: {
    type: mongoose.Types.ObjectId,
    ref: "Order"
  },
  previousOrders: {
    type: [mongoose.Types.ObjectId],
    ref: "Order"
  }

},
  {
    timestamps: true,
    // versionKey: false,
    toJSON: { virtuals: true, password: false },
    toObject: { virtuals: true },
    discriminatorKey: "kind"
  }
)
// userSchema.virtual("order", {
//   ref: 'Image',
//   localField: '_id',
//   foreignField: 'product',
//   justOne: false,
// })

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
})
userSchema.methods.mergeOrders = async function (foreignOrderId) {
  const foreignOrderItems = (await this.model("Order").findOne({ _id: foreignOrderId })).orderItems
  await this.model("Order").findOneAndUpdate({ _id: this.order }, { "$push": { "orderItems": { "$each": foreignOrderItems } } })
}

userSchema.methods.comparePassword = async function (canditatePassword) {
  const isMatch = await bcrypt.compare(canditatePassword, this.password);
  return isMatch;
};

userSchema.virtual("fullName").get(function () {
  return ([this.name.first, this.name.middle, this.name.last]).filter((item) => { return item && item.length > 0 }).join(" ")
})

module.exports = { "User": mongoose.model('User', userSchema), userSchema };

