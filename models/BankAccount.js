const mongoose = require("mongoose")
const mongooseHidden = require("mongoose-hidden")({ defaultHidden: { deleted: true, deletedOn: true, verificationStatus: true, personSchema: true } })

const { NIGERIAN_COMMERCIAL_BANKS } = require("../config/app-data")
const BANK_NAMES = NIGERIAN_COMMERCIAL_BANKS.map((item) => {
    return item.name
})
const accountType = ["personal", "business"]


const bankInfoSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    middleName: String,
    type: {
        type: String,
        enum: {
            values: accountType,
            message: `accountType must be any of ${accountType}`
        },
        required: [true, "accountType is a required field"]
    },
    BVN: {
        type: String,
        trim: true,
        minLength: 10,
    },
    email: {
        type: String,
        trim: true,
        required: true
    },
    number: {
        type: String,
        minLength: 10,
    },
    bankName: {
        type: String,
        enum: { values: BANK_NAMES, message: `Please provide a value from any of the following values: ${BANK_NAMES}` },
        trim: true,
        required: [true, "bankName is a required field"]
    },
    code: {
        type: String,
        minLength: 3,
        required: [true, "sortCode is a required field"],
        trim: true
    },
    verificationStatus: {
        type: Boolean,
        default: false
    },
    person: {
        type: mongoose.Types.ObjectId,
        refPath: "personSchema",
    },
    personSchema: {
        type: String,
        default: "Seller"
    },
    subaccount: {
        type: String,
        required: true
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deletedOn: {
        type: Date
    },
    default: {
        type: Boolean,
        default: true
    },

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})





bankInfoSchema.plugin(mongooseHidden)

module.exports = mongoose.model("BankAccount", bankInfoSchema)