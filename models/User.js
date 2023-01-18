const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const mongooseHidden = require("mongoose-hidden")({ defaultHidden: { password: true, deleted: true, deletedOn: true } })


const GENDER = ["M", "F", null]
const { DEFAULT_USER_PERMISSION } = require("../config/app-data")

const userSchema = new mongoose.Schema({
  firstName: {
    type: String, minLength: 2, maxLength: 64,
    required: [true, "Please provide a first name"],
  },
  middleName: {
    type: String,
  },
  lastName: {
    type: String, minLength: 2, maxLength: 64,
    required: [true, "Please provide a last name"],
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Please provide an email'],
    validate: {
      validator: validator.isEmail,
      message: 'Please provide valid email',
    }
  },
  verified: {
    type: String,
    default: false,
  },
  verifiedEmail: {
    type: Boolean,
    default: false
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
    url: String,
    uploadedAt: {
      type: Date,
    }
  },
  phoneNumber: {
    type: String,
  },

  role: {
    type: String,
    default: "user",
    trim: true
  },
  permissions: {
    type: [String],
    trim: true,
    default: DEFAULT_USER_PERMISSION,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  deletedOn: {
    type: Date,
  },

},
  {
    timestamps: true,
    toJSON: { virtuals: true, password: false },
    toObject: { virtuals: true },
  }
)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);


  //Ensure email is small caps
  this.email = this.email.toLowerCase()
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

userSchema.virtual("fullName").get(function () {
  return ([this.firstName, this.middleName, this.lastName]).filter((item) => { return item && item.length > 0 }).join(" ")
})
userSchema.index({ "firstName": "text", "lastName": "text", "middleName": "text", "createdAt": "text", "email": "text" })



userSchema.plugin(mongooseHidden)


module.exports = mongoose.model("User", userSchema)

