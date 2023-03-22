"use strict"
const { faker } = require("@faker-js/faker")
const { Seller, Book } = require("../models")
const { BOOK_CATEGORY } = require("../config/app-data")





const getSellerIDList = async function () {
    return (await Seller.find({}, { _id: 1 }).lean())
}
const allBooks = require("./complete-books-detail.json")

const createBook = async (limit) => {

    const LENGTH_UNITS = ['inches', "cm", "mm"]
    getSellerIDList().then(async sellerList => {
        const dbBooks = []
        let index = 0
        for await (let book of allBooks) {
            if (index <= limit) {
                index += 1
                book.dimension = {
                    length: (Math.random() * 12).toFixed(2),
                    breadth: (Math.random() * 8).toFixed(2),
                    height: (Math.random() * 4).toFixed(2),
                    unit: LENGTH_UNITS[Math.round(Math.random() * 2)]
                }
                book.seller = sellerList[Math.floor(Math.random() * sellerList.length)]._id
                book.discount = Math.floor(Math.random() * 100)
                book.inventory = Math.floor(Math.random() * 1000)
                book.images = [{ url: book.images }]
                book.publisher = book.publisher ? book.publisher : faker.company.name()
                book.description = book.description || faker.commerce.productDescription()
                book.category = book.category || BOOK_CATEGORY[Math.ceil(Math.random() * BOOK_CATEGORY.length - 2)]
                book.format = [book.format]
                book.name = book.name || "I SHOULD BE DELETED"
                book.price = (Math.random() * 10000).toFixed(2)

                dbBooks.push(book)
            } else {
                break
            }
        }
        await Book.insertMany(dbBooks)

    })



}

const addBooksToDB = (async (number) => {
    createBook(number)
})(50)

module.exports = addBooksToDB