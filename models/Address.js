const mongoose = require("mongoose")


const addressSchema = mongoose.Schema({
    unit: {
        type: String,
        trim: true
    },
    street: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        trim: true
    },
    state: {
        type: String,
        trim: true
    },
    country: {
        type: String,
        trim: true,
        default: "Nigeria"
    },
    zipCode: {
        type: String,
        trim: true
    },
    owner: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    }
})

module.exports = mongoose.model("Address", addressSchema)