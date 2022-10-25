const mongoose = require("mongoose")

const imageSchema = new mongoose.Schema({
    uri: {
        type: String,
        required: [true, "Please provide image(s)"],
        trim: true
    },
    name: {
        type: String,
        trim: true
    },
    product: {
        type: mongoose.Types.ObjectId,
        ref: "Product",
        required: [true, "Please provide product ID for this image"]
    }

})

module.exports = mongoose.model("Image", imageSchema)