const mongoose = require("mongoose")
const { User } = require("./User")
const { nigerianCommercialBanks } = require("../app-data")
const BANK_NAMES = nigerianCommercialBanks.map((item) => {
    return item.name
})

const sellerSchema = new mongoose.Schema({
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

    documents: {
        govtIssuedID: {
            // type: [documentSchema],
            type: [mongoose.Types.ObjectId],
            ref: "Document"
        },
        picture: {
            // type: [documentSchema],
            type: [mongoose.Types.ObjectId],
            ref: "Document"
        },

    },

}, { timestamps: true, discriminatorKey: "kind" })


module.exports = User.discriminator("Seller", sellerSchema)