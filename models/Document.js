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
})


module.exports = mongoose.model("Document", documentSchema, { discriminatorKey: "kind" })