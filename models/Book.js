const validator = require("validator")
const mongoose = require("mongoose")

const Product = require("./Product")
const { validAuthor } = require("../utils/model-utils")
const { bookCategory } = require("../app-data")
const { BadRequestError } = require("../errors")

const bookCoverType = ["paper", "hard"]
const bookCondition = ["new", "used", "refurbished"]
const lengthUnits = ["cm", "inch", "mm"]

const BookSchema = new mongoose.Schema({
    subTitle: {
        type: String,
        trim: true
    },
    abstract: {
        type: String
    },
    publisher: {
        type: String,
        trim: true,
        required: [true, "Please provide a publisher"],
    },
    author: {
        type: [String],
        validate: {
            validator: validAuthor,
            message: "Please provide atleast one author"
        }
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
            message: "Please provide a valid ISSN"
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
    yearOfPublication: {
        type: String,
        trim: true,
        required: [true, "Please provide the year of publication"]
    },
    numberOfPages: {
        type: Number,
        min: 1
    },
    dimension: {
        length: { type: Number, min: 0 },
        width: { type: Number, min: 0 },
        height: { type: Number, min: 0 },
        unit: {
            type: String,
            enum: {
                values: lengthUnits,
                message: `Please provide unit of measurement from any of the following values: ${lengthUnits}`
            }
        }
    },
    bookCoverType: {
        type: String,
        enum: { values: bookCoverType, message: `Please provide book cover type from any of the following values: ${bookCoverType}` },
        required: [true, "Please provide a book cover"],
        trim: true
    },
    language: {
        type: String,
        minLength: 3,
        default: "english",
        trim: true
    },

},
    {
        timestamps: true, discriminatorKey: "kind",
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)

BookSchema.pre("save", async function () {
    const isISBN10 = validator.isISBN(this.ISBN10, 10)
    const isISBN13 = validator.isISBN(this.ISBN10, 13)
    const isISSN = validator.isISSN(this.ISSN)


    if (isISBN10 || isISBN13 || isISSN) {
        throw new BadRequestError("Please provide a valid Book/ Journal identifier")
    }
})

module.exports = Product.discriminator("Book", BookSchema)
