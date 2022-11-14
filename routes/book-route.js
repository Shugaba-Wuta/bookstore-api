

const express = require("express")

const { getAllBooks, getSingleBook, removeBook, registerBook } = require("../controllers/book-controller")



const router = express.Router()
router.route("/products/books").get(getAllBooks).post(registerBook)
router.route("/products/books/:_id").get(getSingleBook).patch(registerBook).delete(removeBook)


module.exports = router