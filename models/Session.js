const mongoose = require("mongoose")

const sessionSchema = mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        refPath: "userModel"
    },
    userModel: {
        required: true,
        type: String,
        enum: {
            values: ["User", "Seller", "Admin", "Staff"]
        },
        default: "User"

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