const mongoose = require("mongoose")
const { DOCUMENT_CATEGORY_TYPES } = require("../config/app-data")
const mongooseHidden = require("mongoose-hidden")({ defaultHidden: { deleted: true, deletedOn: true } })


const documentSchema = new mongoose.Schema({
    category: {
        type: String,
        required: [true, "document category is required"],
        enum: {
            message: "{VALUE} is not supported",
            values: DOCUMENT_CATEGORY_TYPES
        }
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