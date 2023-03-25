

const express = require("express")

const { getAllBooks, getSingleBook, removeBook, registerBook, updateBook, } = require("../controllers/book-controller")
const { isPersonAuthorized } = require("../middleware/auth middleware")



const router = express.Router()



router.get("/", getAllBooks)


router.post("/", [isPersonAuthorized], registerBook)

router.get("/:bookID", getSingleBook)



router.patch("/:bookID", [isPersonAuthorized], updateBook)


router.delete("/:bookID", [isPersonAuthorized], removeBook)


module.exports = router