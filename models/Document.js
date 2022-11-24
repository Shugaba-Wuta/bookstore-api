const mongoose = require("mongoose")
const path = require("path")
const fs = require("fs")

const documentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    purpose: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Types.ObjectId,
        refPath: "userType",
    },
    userType: {
        type: String,
        required: true,
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deletedOn: {
        type: Date
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
})


module.exports = mongoose.model("Document", documentSchema)