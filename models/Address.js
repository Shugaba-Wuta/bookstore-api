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
    person: {
        type: String,
        refPath: "personSchemaType",
        required: [true, "Please provide the person's ID"]
    },
    personSchemaType: {
        type: mongoose.Types.ObjectId,
        required: true,
        enum: ["User", "Seller"]
    },
    default: {
        type: Boolean,
        default: false
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deletedOn: {
        type: Date
    }
})

module.exports = mongoose.model("Address", addressSchema)