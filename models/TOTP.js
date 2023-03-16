const mongoose = require("mongoose")
const validator = require("validator")
const { MAX_OTP_TIME_IN_SECONDS, TIME_TOLERANCE_FOR_OTP } = require("../config/app-data")

const totpSchema = mongoose.Schema({
    purpose: { type: String, required: [true, "Token.purpose is a required field"] },
    email: {
        type: String,
        validator: { validator: validator.isEmail, message: "Please provide valid email" },
    },
    used: {
        type: Boolean,
        default: false
    },
    person: {
        type: mongoose.Types.ObjectId,
        refPath: "userType",
    },
    personSchema: {
        type: String,
        required: true,
    },
    totp: {
        type: String,
        required: [true, "Please provide an OTP code"]
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
})




totpSchema.static("generateCode", function () {
    return Math.random().toString(10).substring(3, 9)
})
totpSchema.static("createAToken", async function (person, personSchema, email, purpose) {
    const totp = this.generateCode()
    const existingToken = await this.findOne({ email, purpose, used: false })
    if (!existingToken) {
        const token = await this.create({ person, personSchema, email, purpose, totp })
        return token.totp
    }
    return existingToken.totp

})

totpSchema.index({ createdAt: 1 }, { expireAfterSeconds: Math.ceil(MAX_OTP_TIME_IN_SECONDS * TIME_TOLERANCE_FOR_OTP) })
totpSchema.index({ email: 1, used: 1 }, { unique: true })




module.exports = mongoose.model("TOTP", totpSchema)