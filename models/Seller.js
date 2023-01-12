const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcryptjs")
const { nigerianCommercialBanks } = require("../config/app-data")
const BANK_NAMES = nigerianCommercialBanks.map((item) => {
    return item.name
})
const GENDER = ["M", "F", null]
const { DEFAULT_SELLER_PERMISSION } = require("../config/app-data")


const sellerSchema = new mongoose.Schema({
    firstName: {
        type: String, minLength: 2, maxLength: 64,
        required: [true, "Please provide a first name"],
        trim: true
    },
    middleName: {
        type: String,
        trim: true

    },
    lastName: {
        type: String, minLength: 2, maxLength: 64,
        required: [true, "Please provide a last name"],
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'Please provide email'],
        validate: {
            validator: validator.isEmail,
            message: 'Please provide valid email',
        },
        trim: true
    },
    verified: {
        type: String,
        default: false
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
            type: Date
        }
    },

    role: {
        type: String,
        default: "seller"
    },

    deleted: {
        type: Boolean,
        default: false
    },
    deletedOn: {
        type: Date
    },
    accountNumber: {
        type: String,
        minLength: 10
    },
    accountName: {
        type: String,
        trim: true
    },
    bankName: {
        type: String,
        enum: { values: BANK_NAMES, message: `Please provide a value from any of the following values: ${BANK_NAMES}` },
        trim: true
    },
    phoneNumber: {
        type: String
    },
    BVN: {
        type: Number,
        min: 9999999999
    },
    NIN: {
        type: Number,
        min: 9999999999
    },
    govtIssuedID: [{
        url: String,
        name: String,
        uploadedAt: {
            type: Date,
        },
        deleted: {
            type: Boolean,
            default: false
        },
        deletedOn: {
            type: Date
        }
    }],
    pictures: [{
        url: String,
        name: String,
        uploadedAt: {
            type: Date,
        },
        deleted: {
            type: Boolean,
            default: false
        },
        deletedOn: {
            type: Date
        }
    }],
    permissions: {
        type: [String],
        trim: true,
        default: DEFAULT_SELLER_PERMISSION
    }

},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        timestamps: true,
    }
)

sellerSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    //Ensure email is small caps
    this.email = this.email.toLowerCase()
})

sellerSchema.methods.comparePassword = async function (candidatePassword) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
};

sellerSchema.virtual("fullName").get(function () {
    return ([this.firstName, this.middleName, this.lastName]).filter((item) => { return item && item.length > 0 }).join(" ")
})
sellerSchema.index({ "firstName": "text", "lastName": "text", "middleName": "text" })

module.exports = mongoose.model("Seller", sellerSchema)