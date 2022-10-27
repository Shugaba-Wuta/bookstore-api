const mongoose = require("mongoose")
const { Document } = require("./Document")

const imageSchema = new mongoose.Schema({
    product: {
        type: mongoose.Types.ObjectId,
        ref: "Product",
        required: [true, "Please provide product ID for this image"]
    }

}, { discriminatorKey: "kind" })

module.exports = Document.discriminator("Image", imageSchema)
