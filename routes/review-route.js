const express = require("express")
const { createAReview, updateReview, deleteReview, getUserReview, getUserReviews, getBookReviews } = require("../controllers/review-controller")
const { isPersonAuthorized } = require("../middleware/auth middleware")

const router = express.Router()



router.post("/", createAReview).get("/", getBookReviews)
router.get("/user/:userID", getUserReviews)

router.route("/:reviewID").get(getUserReview).patch(isPersonAuthorized, updateReview).delete(isPersonAuthorized, deleteReview)

module.exports = router