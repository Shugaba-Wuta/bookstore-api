const validator = require("validator")
const { Product } = require("../models")
const { bookCategory } = require("../app-data")
const { BadRequestError } = require("../errors")
const { StatusCodes } = require("http-status-codes")



const getAllBooks = (req, res) => {
    const { featured, verified, publisher, freeShipping, discount, category } = req.query
    const findParam = {}
    if (featured) {
        findParam.featured = true
    }
    if (verified) {
        findParam.verified = true
    }
    if (freeShipping) {
        findParam.freeShipping = true
    }
    if (discount) {
        findParam.discount = true
    }
    if (category) {
        if (bookCategory.includes(category)) {
            findParam.category = category
        } else {
            throw new BadRequestError("Please provide a valid book category")
        }
    }
    if (publisher) {
        findParam.publisher = publisher

    }


}
const getSingleBook = () => {

}
const registerBook = async (req, res) => {
    const { name, description, inventory, department, seller, price, discount, tags, shippingFee, subTitle, abstract, publisher, author, ISBN10, ISBN13, ISSN, category, edition, volume, yearOfPublication, numberOfPages, dimension, bookCoverType, language, dimensionUnits } = req.body
    registerParam = req.body
    res.status(StatusCodes.CREATED).json({ message: "successufully registered book", success: true, result: [registerParam] })


}

const removeBook = () => {

}
const updateBook = () => {

}









module.exports = { getAllBooks, getSingleBook, registerBook, removeBook, updateBook }