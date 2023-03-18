"use strict"
const { Book } = require("../models")
const { BadRequestError, NotFoundError } = require("../errors")
const { StatusCodes } = require("http-status-codes")
const { PRODUCT_FORBIDDEN_FIELDS } = require("../config/app-data")
const { RESULT_LIMIT } = require("../config/app-data")
const { uploadFileToS3 } = require("../utils/generic-utils")
const crypto = require("crypto")
const path = require("path")
const NON_EDITABLE_FIELDS = { featured: 0, deleted: 0, deletedOn: 0 }

const getAllBooks = async (req, res) => {
    const { featured, freeShipping, minDiscount, maxDiscount, currency, minPrice, maxPrice, language, format, query, fields, isbn10, isbn13, issn, sortBy: sort, descending, sellerID } = req.query
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
    if (sellerID) {
        findParams.seller = sellerID
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


    return res.status(StatusCodes.OK).json({ message: "Fetched books", success: true, result: booksInDB })

}
const getSingleBook = async (req, res) => {
    const { bookID } = req.params
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
    if (!bookInDB) {
        throw new NotFoundError("bookID does not point to any resource")
    } else {
        bookInDB.views += 1
        await bookInDB.save()
    }
    return res.status(StatusCodes.OK).json({
        message: "Fetched a single book",
        success: true,
        result: [bookInDB]
    })
}

const registerBook = async (req, res) => {
    const { images } = req.files || {}
    let bookPath = ["uploads", req.user.userID].join("-")
    const imagesArray = (images instanceof Array) ? images : [images]
    if (images) {
        const docs = imagesArray.map(doc => {
            var name = [bookPath, crypto.randomBytes(12).toString("hex") + path.extname(doc.name)].join("-")
            return { name, data: doc.data }
        });
        var publicUrls = await uploadFileToS3(docs)
        Object.keys(NON_EDITABLE_FIELDS).forEach(field => {
            delete req.body[field]
        })
    }
    const newBook = new Book(req.body)
    newBook.images = publicUrls
    await newBook.save()
    res.status(StatusCodes.CREATED).json({ message: "successfully registered book", success: true, result: [newBook] })
}

const updateBook = async (req, res) => {
    const { bookID } = req.params
    if (!bookID) {
        throw new BadRequestError("Please provide a value for field bookID")
    }
    const { images } = req.files || {}

    Object.keys(NON_EDITABLE_FIELDS).forEach((field) => {
        delete req.body[field]
    })
    const updateParams = { $set: req.body }
    if (images) {
        let bookPath = ["uploads", "sellers", req.user.userID].join("-")
        const imagesArray = (images instanceof Array) ? images : [images]
        const docs = imagesArray.map(doc => {
            var name = [bookPath, crypto.randomBytes(12).toString("hex") + path.extname(doc.name)].join("-")
            return { name, data: doc.data }

        });
        let publicUrls = await uploadFileToS3(docs)
        updateParams.$push = { images: { $each: publicUrls } }

    }

    const updatedBook = await Book.findOneAndUpdate({ _id: bookID, deleted: false }, updateParams, { new: true }).select(PRODUCT_FORBIDDEN_FIELDS)
    if (!updatedBook) {
        throw new BadRequestError("Please provide a value for field bookID")
    }

    res.status(StatusCodes.OK).json({ message: "Update was successful", success: true, result: [updatedBook] })

}
const removeBook = async (req, res) => {
    const { bookID } = req.params

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
CRUD OPERATIONS FOR REVIEWS ACCESSED BASED ON BOOK_ID
*/

const getAllReviewsOnBook = async (req, res) => {
    const { bookID } = req.params



}

const getAReviewOnBook = async (req, res) => {

}

const createAReviewOnBook = async (req, res) => {

}




module.exports = { getAllBooks, getSingleBook, registerBook, removeBook, updateBook, getAReviewOnBook, getAllReviewsOnBook, createAReviewOnBook }