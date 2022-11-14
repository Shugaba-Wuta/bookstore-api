const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');


const GENDER = ["M", "F", null]

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
    path: String,
    uploadedAt: {
      type: Date,
    }
  },
  phoneNumber: {
    type: String,
  },

  role: {
    type: String,
    default: "user"
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedOn: {
    type: Date
  },

},
  {
    timestamps: true,
    toJSON: { virtuals: true, password: false },
    toObject: { virtuals: true },
    discriminatorKey: "kind"
  }
)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);


  //Ensure email is small caps 
  this.email = this.email.toLowerCase()
})

userSchema.methods.comparePassword = async function (canditatePassword) {
  const isMatch = await bcrypt.compare(canditatePassword, this.password);
  return isMatch;
};

userSchema.virtual("fullName").get(function () {
  return ([this.firstName, this.middleName, this.lastName]).filter((item) => { return item && item.length > 0 }).join(" ")
})
userSchema.index({ "firstName": "text", "lastName": "text", "middleName": "text" })
module.exports = mongoose.model("User", userSchema)

