const mongoose = require("mongoose")
const mongooseHidden = require("mongoose-hidden")({ defaultHidden: { deleted: true, deletedOn: true } })

const { nigerianCommercialBanks } = require("../config/app-data")
const BANK_NAMES = nigerianCommercialBanks.map((item) => {
    return item.name
})


const bankInfoSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
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
        trim: true
    },
    code: {
        type: String,
        minLength: 3,
        required: true,
        trim: true
    },
    verificationStatus: {
        type: Boolean,
        default: true
    },
    person: {
        type: mongoose.Types.ObjectId,
        refPath: "personSchema",
    },
    personSchema: {
        type: String,
        required: true,
    },
    subaccount: String,
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
    }

})
bankInfoSchema.pre("save", async function ensureOnlyOneDefaultBankAccount(next) {
    const samePerson = await this.model("BankAccount").find({ person: this.person, personSchemaType: this.personSchemaType }).lean()
    let numberOfDefaults = 0
    samePerson.forEach(bankInfo => {
        if (numberOfDefaults > 0 && bankInfo.default) {
            bankInfo.default = false
        }
    })
    next()
})




bankInfoSchema.plugin(mongooseHidden)

module.exports = mongoose.model("BankAccount", bankInfoSchema)