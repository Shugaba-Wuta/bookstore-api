

const express = require("express")

const { getAllBooks, getSingleBook, removeBook, registerBook, updateBook } = require("../controllers/book-controller")
const { authenticateUser, authorizeRoles, assignSessionID, ensureSameUserOrElevatedUser } = require("../middleware/auth middleware")



const router = express.Router()
router.route("/products/books").get(getAllBooks).post([authorizeRoles("seller"), ensureSameUserOrElevatedUser], registerBook)
router.route("/products/books/:_id").get(getSingleBook).patch([authorizeRoles("seller"), ensureSameUserOrElevatedUser], updateBook).delete([authorizeRoles("seller"), ensureSameUserOrElevatedUser], removeBook)


module.exports = router