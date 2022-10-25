const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const ROLES = ["admin", "user", "publisher", "seller", "root", "staff", "manager"]
const GENDER = ["M", "F"]

const UserSchema = new mongoose.Schema({
  name: {
    type: Map,
    of: new mongoose.Schema({
      first: {
        type: String, minLength: 4, maxLength: 64,
        required: [true, "Please provide a first name"]
      },
      middle: {
        type: String, minLength: 2, maxLength: 64,
      },
      last: {
        type: String, minLength: 2, maxLength: 64,
        required: [true, "Please provide a last name"]
      }

    })
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Please provide email'],
    validate: {
      validator: validator.isEmail,
      message: 'Please provide valid email',
    },
    password: {
      type: String,
      required: [true, 'Please provide password'],
      minlength: 8,
    },
    phoneNumber: {
      type: String
    },
    gender: {
      type: String,
      enum: GENDER
    },
    role: {
      type: String,
      enum: {
        values: ROLES,
        message: `Role must be either of the following: ${ROLES}, received ${VALUE}`
      },
      default: "user"
    },
  }
},
  {
    timestamps: true,
  }
)


UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
})

UserSchema.methods.comparePassword = async function (canditatePassword) {
  const isMatch = await bcrypt.compare(canditatePassword, this.password);
  return isMatch;
};

UserSchema.methods.getFullName = async function () {
  return ([this.name.first, this.name.middle, this.name.last]).filter((item) => { return item && item.length > 0 }).join(" ")
}



const User = mongoose.model('User', UserSchema);
module.exports = User 
