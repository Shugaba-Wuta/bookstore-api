const mongoose = require("mongoose")
const Product = require("./Product")
const { validAuthor } = require("../utils/model-utils")
const validator = require("validator")
const { bookStore } = require("../app-data")
const bookCoverType = ["paper", "hard"]
const bookCondition = ["new", "used", "refurbished"]

const BookSchema = new mongoose.Schema({
    subTitle: {
        type: String,
        minLength: 5,
        maxLength: 100,
        trim: true
    },
    abstract: {
        type: String,

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
        enum: { values: bookStore, message: `Please provide a category from any of the following: ${bookStore}` },
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
        height: { type: Number, min: 0 }
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
    condition: {
        type: String,
        enum: { values: bookCondition, message: `Please provide book condition of any of the values: ${bookCondition}` },
        default: "new",
        trim: true
    }
})

BookSchema.pre("save", async function () {
    const isISBN10 = validator.isISBN(this.ISBN10, 10)
    const isISBN13 = validator.isISBN(this.ISBN10, 13)


    if (isISBN10 || isISBN13) {
        throw Error("Please provide valid ISBN-10 or an ISBN-13")
    }
})
module.exports = Product.discriminator("Book", BookSchema, { discriminatorKey: "kind" })