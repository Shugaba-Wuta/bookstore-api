const validator = require("validator")
const mongoose = require("mongoose")
const mongooseHidden = require("mongoose-hidden")()

const productBaseSchema = require("./productSchemaBase")
const { bookCategory } = require("../config/app-data")
const { BadRequestError } = require("../errors")

const bookCoverType = ["Paperback", "Hardback", "Others"]
const lengthUnits = ["cm", "inches", "mm"]

const BookSchema = new mongoose.Schema({
    subtitle: {
        type: String,
        trim: true,
    },
    abstract: {
        type: String,
        trim: true
    },
    publisher: {
        type: String,
        trim: true,
        required: [true, "Please provide a publisher"],
    },
    authors: {
        type: [String],
        required: [true, "Please provide an author"]
    },

    ISBN10: {
        type: String,
        validate: {
            validator: validator.isISBN,
            message: "Please provide valid ISBN identifier"
        },
        trim: true,
    },
    ISBN13: {
        type: String,
        validate: {
            validator: validator.isISBN,
            message: "Please provide valid ISBN identifier"
        },
        trim: true
    },
    ISSN: {
        type: String,
        validate: {
            validator: validator.isISSN,
            message: "Please provide a valid ISSN number"
        },
        trim: true
    },

    category: {
        type: String,
        enum: { values: bookCategory, message: `Please provide a category from any of the following: ${bookCategory}` },
        required: [true, "Please provide a category for for your book"],
        trim: true,
    },
    edition: {
        type: Number,
        min: 1,
    },
    volume: {
        type: Number,
        min: 1
    },
    publicationDate: {
        type: String,
        trim: true,
        required: [true, "Please provide the year of publication"]
    },
    numberOfPages: {
        type: Number,
        min: 0
    },
    dimension: {
        length: { type: Number, min: 0 },
        breadth: { type: Number, min: 0 },
        height: { type: Number, min: 0 },
        unit: {
            type: String,
            enum: {
                values: lengthUnits,
                message: `Please provide unit of measurement from any of the following values: ${lengthUnits}`
            }
        }
    },
    format: {
        type: [String],
        enum: { values: bookCoverType, message: `Please provide book cover type from any of the following values: ${bookCoverType}` },
        required: [true, "Please provide a book cover"],
        trim: true
    },
    language: {
        type: String,
        minLength: 2,
        default: "en",
        trim: true
    },
    views: {
        type: Number,
        min: 0,
        default: 0
    }

},
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)

BookSchema.pre("save", async function () {
    //Perform a validation on unique book identifiers.
    const isISBN10 = this.ISBN10 ? validator.isISBN(this.ISBN10, 10) : false
    const isISBN13 = this.ISBN13 ? validator.isISBN(this.ISBN13, 13) : false
    const isISSN = this.ISSN ? validator.isISSN(this.ISSN) : false

    if (!isISBN10 && !isISBN13 && !isISSN) {
        throw new BadRequestError("Please provide a valid Book/ Journal identifier")
    }
})
BookSchema.index(
    {
        subtitle: "text",
        abstract: "text",
        authors: "text",
        name: "text",
        description: "text",
        tags: "text"
    },
    {
        weights: {
            authors: 35,
            subtitle: 25,
            tags: 20,
            description: 10,
            name: 25

        }
    }
)
BookSchema.index({ seller: 1, ISBN10: 1, ISBN13: 1, ISSN: 1 }, { unique: true })




BookSchema.add(productBaseSchema)
BookSchema.plugin(mongooseHidden)

module.exports = { Book: mongoose.model("Book", BookSchema), bookCoverType }