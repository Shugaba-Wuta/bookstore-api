const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcryptjs")
const { CustomAPIError } = require("../errors")
const { MAX_OTP_TIME_IN_SECONDS } = require("../app-data")

const totpSchema = mongoose.Schema({
    role: String,
    email: {
        type: String,
        validator: { validator: validator.isEmail, message: "Please provide valid email" },
    },
    used: {
        type: Boolean,
        default: false
    },
    user: {
        type: mongoose.Types.ObjectId,
        refPath: "userType",
    },
    userType: {
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

totpSchema.pre("save", async function () {
    if (!this.isModified('totp')) return;
    const salt = await bcrypt.genSalt(10);
    this.totp = await bcrypt.hash(this.totp, salt);
})

totpSchema.methods.compareOTP = async function (canditateOTP) {
    const isMatch = await bcrypt.compare(canditateOTP, this.totp);
    return isMatch;
};
totpSchema.index({ createdAt: 1 }, { expireAfterSeconds: MAX_OTP_TIME_IN_SECONDS })
totpSchema.index({ email: 1, used: 1 }, { unique: true })




module.exports = mongoose.model("TOTP", totpSchema)