"use strict"
const validator = require("validator")
const mongoose = require("mongoose")
const { Product, Book } = require("../models")
const { bookCategory } = require("../app-data")
const { BadRequestError, NotFoundError } = require("../errors")
const { StatusCodes } = require("http-status-codes")
const { PRODUCT_FORBIDDEN_FIELDS } = require("../app-data")
const { RESULT_LIMIT } = require("../app-data")

const NONEDITABLE_FIELDS = { featured: 0, deleted: 0, deletedOn: 0 }

const getAllBooks = async (req, res) => {
    const { featured, freeShipping, minDiscount, maxDiscount, currency, minPrice, maxPrice, language, format, q: query, fields, isbn10, isbn13, issn, sortBy: sort, descending } = req.query
    const findParams = { deleted: false }
    if (typeof (featured) !== "undefined") {
        findParams.featured = featured
    }
    if (typeof (freeShipping) !== "undefined") {
        findParams.shippingFee = 0
    }
    if (minDiscount) {
        if (0 <= Number(minDiscount) <= 100) {
            throw new BadRequestError(`minDiscount must be between the range [0, 100]`)
        }
        if (!findParams.discount) {
            findParams.discount = {}
        }
        findParams.discount.$gte = Number(minDiscount)

    }
    if (maxDiscount) {
        if (!findParams.discount) {
            findParams.discount = {}
        }
        findParams.discount.$lte = Number(maxDiscount)

    }
    if (currency) {
        findParams.currency = currency
    }
    if (maxPrice) {
        if (!findParams.price) {
            findParams.price = {}
        }
        findParams.price.$lte = Number(maxPrice)

    }
    if (minPrice) {
        if (!findParams.price) {
            findParams.price = {}
        }
        findParams.price.$gte = Number(minPrice)

    }
    if (language) {
        findParams.language = language
    }
    if (format) {
        findParams.format = format
    }

    if (query) {
        findParams.$text = { $search: query }
    }
    if (isbn10) {
        findParams.ISBN10 = isbn10
    }
    if (isbn13) {
        findParams.ISBN13 = isbn13
    }
    if (issn) {
        findParams.ISSN = issn
    }

    let findQuery = Book.find(findParams)

    if (fields) {
        let finalQueryFields = {}
        fields.split(",").forEach(field => {
            field = field.trim()
            if (!(Object.keys(PRODUCT_FORBIDDEN_FIELDS).includes(field))) {
                finalQueryFields[field] = 1
            }
        })
        findQuery.select(finalQueryFields)

    } else {
        findQuery.select(PRODUCT_FORBIDDEN_FIELDS)
    }
    //default sort is createdAt
    if (sort) {
        //sort is a string of comma separated fields in order of preference
        //default sorting order is ascending 
        let finalSort = sort.replace(/\s/g, "").split(",").filter(field => { return Boolean(field) })
        if (typeof descending !== "undefined" && descending) {
            findQuery.sort(finalSort.reduce((a, v) => ({ ...a, [v]: -1 }), {}))
        } else {
            findQuery.sort(finalSort.reduce((a, v) => ({ ...a, [v]: 1 }), {}))
        }
    } else if (query) {
        findQuery.sort({ score: { $meta: "textScore" } })
    } else {
        findQuery.sort({ createdAt: 1, updatedAt: 1, })
    }

    const productLimit = Number(req.query.limit)
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1
    const limit = (productLimit <= RESULT_LIMIT && productLimit > 0) ? productLimit : RESULT_LIMIT
    const skip = (page - 1) * limit
    findQuery = findQuery.limit(limit).skip(skip)

    const booksInDB = await findQuery
    if (booksInDB.length < 1) {
        throw new NotFoundError("No book found")
    }

    return res.status(StatusCodes.OK).json({ message: "Fetched books", success: true, result: booksInDB })

}
const getSingleBook = async (req, res) => {
    const { _id: bookID } = req.params
    console.log(req.params._id)
    const { fields } = req.query
    const findQuery = Book.findOne({ deleted: false, _id: bookID })

    if (fields) {
        let finalQueryFields = fields.replace(/\s/g, "").split(",")
            .filter(field => {
                return !(Object.keys(PRODUCT_FORBIDDEN_FIELDS).includes(field))
            })
        if (finalQueryFields.length > 0) {
            findQuery.select(finalQueryFields.reduce((a, v) => ({ ...a, [v]: 1 }), {}))
        }
    } else {
        findQuery.select(PRODUCT_FORBIDDEN_FIELDS)
    }

    const bookInDB = await findQuery
    return res.status(StatusCodes.OK).json({
        message: "Fetched a single book",
        success: true,
        result: [bookInDB]
    })
}

const registerBook = async (req, res) => {
    Object.keys(NONEDITABLE_FIELDS).forEach(field => {
        delete req.body[field]
    })
    const newBook = new Book(req.body)
    await newBook.save()
    res.status(StatusCodes.CREATED).json({ message: "successufully registered book", success: true, result: [newBook] })
}

const updateBook = async (req, res) => {
    Object.keys(NONEDITABLE_FIELDS).forEach((field) => {
        delete req.body[field]
    })
    const bookID = req.params._id
    const updatedBook = await Book.findOneAndUpdate({ _id: bookID, deleted: false }, req.body).select(PRODUCT_FORBIDDEN_FIELDS)

    res.status(StatusCodes.OK).json({ message: "Update was successful", success: true, result: [updatedBook] })

}
const removeBook = async (req, res) => {
    const bookID = req.params._id
    const deletedBook = await Book.findOneAndUpdate({ deleted: false, _id: bookID }, { $set: { deleted: true, deletedOn: Date.now() } })

    if (!deletedBook) {
        throw new BadRequestError(`No book record was found`)
    }
    return res.status(StatusCodes.OK).json({
        message: "Book was successfully deleted",
        success: true,
        result: deletedBook
    })
}






/*  
CRUD OPERATIONS FOR REVIEWS ACCESSED BASED ON BOOKID
*/

const getAllReviewsOnBook = async (req, res) => {
    const { _id: bookID } = req.params



}

const getAReviewOnBook = async (req, res) => {

}

const createAReviewOnBook = async (req, res) => {

}




module.exports = { getAllBooks, getSingleBook, registerBook, removeBook, updateBook, getAReviewOnBook, getAllReviewsOnBook, createAReviewOnBook }