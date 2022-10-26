const validator = require("validator")
const { Product } = require("../models")
const { bookCategory } = require("../app-data")
const { BadRequestError } = require("../errors")



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
const registerBook = () => {

}

const removeBook = () => {

}
const updateBook = () => {

}









module.exports = { getAllBooks, getSingleBook, registerBook, removeBook, updateBook }