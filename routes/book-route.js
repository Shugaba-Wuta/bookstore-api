

const express = require("express")

const { getAllBooks, getSingleBook, removeBook, registerBook, updateBook, getAllReviewsOnBook } = require("../controllers/book-controller")
const { authorizeRoles, ensureSamePerson } = require("../middleware/auth middleware")



const router = express.Router()



router.get("/", getAllBooks)


router.post("/", [authorizeRoles("seller"), ensureSamePerson], registerBook)

router.get("/:_id", getSingleBook)



router.patch("/:_id", [authorizeRoles("seller"), ensureSamePerson], updateBook)


router.delete("/:_id", [authorizeRoles("seller"), ensureSamePerson], removeBook)

router.get("/:_id/reviews", getAllReviewsOnBook)

module.exports = router