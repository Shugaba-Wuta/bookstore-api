const mongoose = require("mongoose")
const documentSchema = mongoose.Schema({
    name: {
        type: [String],
        trim: true
    },
    path: {
        type: String,
        trim: true
    },
    url: {
        type: String,
        trim: true
    }
}, { discriminatorKey: "kind" })


module.exports = { Document: mongoose.model("Document", documentSchema), documentSchema }
