const mongoose = require("mongoose")
const ratingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        required: [true, "Rating must come from a registered user"]
    },
    score: {
        type: Number,
        min: 1,
        max: 5
    },
    product: {
        type: mongoose.Types.ObjectId,
        ref: "Product",
        required: true

    }
}, { timestamps: true })

module.exports = mongoose.model("Rating", ratingSchema)