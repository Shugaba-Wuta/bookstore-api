const mongoose = require("mongoose")
const mongooseHidden = require("mongoose-hidden")({ defaultHidden: { deleted: true, deletedOn: true } })


const documentSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true
    },
    refID: {
        type: String,
    },
    url: String,
    uploadedAt: {
        type: Date,
        default: Date.now
    },

    person: {
        type: mongoose.Types.ObjectId,
        refPath: "personSchema",
    },
    personSchema: {
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



documentSchema.plugin(mongooseHidden)
module.exports = mongoose.model("Document", documentSchema)