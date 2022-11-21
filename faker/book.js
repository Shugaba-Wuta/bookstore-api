"use strict"
const { faker } = require("@faker-js/faker")
const { Seller, Book } = require("../models")
const { bookCategory } = require("../app-data")
const fs = require("fs")





const getSellerIDList = async function () {
    return (await Seller.find({}, { _id: 1 }).lean())
}
const allBooks = require("../complete-books-detail.json")

const createBook = async () => {


    const LENGTH_UNITS = ['inches', "cm", "mm"]
    getSellerIDList().then(async sellerList => {
        const dbBooks = allBooks.map((book, index) => {
            if (index < allBooks.length) {
                book.dimension = {
                    length: Math.random() * 12,
                    breadth: Math.random() * 8,
                    height: Math.random() * 4,
                    unit: LENGTH_UNITS[Math.round(Math.random() * 2)]
                }
                book.seller = sellerList[Math.floor(Math.random() * sellerList.length)]._id
                book.discount = Math.floor(Math.random() * 100)
                book.inventory = Math.floor(Math.random() * 1000)
                const newImages = book.images
                book.images = [{ url: newImages }]
                book.publisher = book.publisher || faker.company.name()
                book.description = book.description || faker.commerce.productDescription()
                book.category = book.category || bookCategory[Math.ceil(Math.random() * bookCategory.length - 1)]
                book.format = [book.format]
                book.name = book.name || "I SHOULD BE DELETED"
                book.price = {}
                book.format.forEach((format) => {
                    book.price[`${format}`] = Math.random() * 10000
                })
                return book
            }
        })
        await Book.insertMany(dbBooks)
        console.log(dbBooks.length)


    })



}
createBook()
const addBooksToDB = async (number) => {
    try {

    } catch (err) {
        throw err
    }

}

module.exports = addBooksToDB