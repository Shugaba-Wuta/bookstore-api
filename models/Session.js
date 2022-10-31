const mongoose = require("mongoose")

const sessionSchema = mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    order: {
        type: mongoose.Types.ObjectId,
        ref: "Order"
    },
    IP: {
        type: String,
        trim: true
    },
    userAgent: {
        type: String,
        trim: true
    },


}, {
    timestamps: true,
    // versionKey: false,
    toJSON: { virtuals: true, password: false },
    toObject: { virtuals: true }
})

module.exports = mongoose.model("Session", sessionSchema)