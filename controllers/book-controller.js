"use strict"
const validator = require("validator")
const { Product, Book } = require("../models")
const { bookCategory } = require("../app-data")
const { BadRequestError } = require("../errors")
const { StatusCodes } = require("http-status-codes")



const getAllBooks = (req, res) => {
    const { featured, verified, publisher, freeShipping, discount, category } = req.query
    const findParams = {}



}
const getSingleBook = () => {

}
const registerBook = async (req, res) => {
    const newBook = new Book(req.body)
    if (!await newBook.validate()) {
        console.log()
    }
    await newBook.save()
    const registerParam = req.body
    res.status(StatusCodes.CREATED).json({ message: "successufully registered book", success: true, result: [registerParam] })


}

const removeBook = () => {

}
const updateBook = () => {

}









module.exports = { getAllBooks, getSingleBook, registerBook, removeBook, updateBook }