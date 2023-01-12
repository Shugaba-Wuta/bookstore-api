

const express = require("express")

const { getAllBooks, getSingleBook, removeBook, registerBook, updateBook, getAllReviewsOnBook } = require("../controllers/book-controller")
const { authorizeRoles, ensureSamePerson } = require("../middleware/auth middleware")



const router = express.Router()



router.get("/", getAllBooks)


router.post("/", [authorizeRoles("seller"), ensureSamePerson], registerBook)

router.get("/:bookID", getSingleBook)



router.patch("/:bookID", [authorizeRoles("seller"), ensureSamePerson], updateBook)


router.delete("/:bookID", [authorizeRoles("seller"), ensureSamePerson], removeBook)

router.get("/:bookID/reviews", getAllReviewsOnBook)

module.exports = router