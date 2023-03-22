const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcryptjs")
// const { NIGERIAN_COMMERCIAL_BANKS } = require("../config/app-data")
// const BANK_NAMES = NIGERIAN_COMMERCIAL_BANKS.map((item) => {
//     return item.name
// })


const mongooseHidden = require("mongoose-hidden")({ defaultHidden: { password: true, deleted: true, deletedOn: true } })
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
        type: Boolean,
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
    phoneNumber: {
        type: String,
        trim: true
    },
    NIN: {
        type: Number,
        min: 9999999999
    },
    permissions: {
        type: [String],
        trim: true,
        default: DEFAULT_SELLER_PERMISSION,
        hide: true
    }

},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        timestamps: true,
    }
)

sellerSchema.virtual("addresses", {
    ref: "Address",
    localField: "_id",
    foreignField: "person",
})
sellerSchema.virtual("documents", {
    ref: "Document",
    foreignField: "person",
    localField: "_id",
    match: { deleted: false }
})
sellerSchema.virtual("bankAccounts", {
    ref: "BankAccount",
    foreignField: "person",
    localField: "_id",
    match: { deleted: false }
})
sellerSchema.virtual("books", {
    ref: "Book",
    foreignField: "seller",
    localField: "_id"
})
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


sellerSchema.plugin(mongooseHidden)

module.exports = mongoose.model("Seller", sellerSchema)