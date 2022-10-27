const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { documentSchema } = require('./Document');
const { nigerianCommercialBanks } = require("../app-data")


const ROLES = ["user", "publisher", "seller",]
const GENDER = ["M", "F"]
const BANK_NAMES = nigerianCommercialBanks.map((bank) => { return bank.name })

const UserSchema = new mongoose.Schema({
  name: {

    first: {
      type: String, minLength: 4, maxLength: 64,
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
  phoneNumber: {
    type: String
  },
  gender: {
    type: String,
    enum: GENDER
  },
  documents: {
    govtIssuedID: {
      type: [documentSchema],
    },
    picture: {
      type: [documentSchema]
    }
  },
  BVN: {
    type: Number,
    min: 9999999999
  },
  NIN: {
    type: Number,
    min: 9999999999
  },
  account: {
    number: {
      type: String,
      minLength: 10
    },
    name: {
      type: String,
    },
    bankName: {
      type: String,
      enum: { values: BANK_NAMES, message: `Please provide a value from any of the following values: ${BANK_NAMES}` },
    }
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
  }
},
  { timestamps: true, versionKey: false, toJSON: true, toObject: true }
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

UserSchema.virtual("fullName").get(function () {
  return ([this.name.first, this.name.middle, this.name.last]).filter((item) => { return item && item.length > 0 }).join(" ")
})

module.exports = mongoose.model('User', UserSchema);

