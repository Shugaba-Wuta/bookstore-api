const express = require("express")
const { authorizeRoles, ensureSamePerson } = require("../middleware/auth middleware")
const { getAllUsers, registerUser, getSingleUser, updateUser, removeUser, updateASingleReviewBySingleUser, getASingleReviewByUser, getAllReviewBySingleUser, reviewProduct, deleteASingleReview } = require("../controllers/user-controller")



const router = express.Router()

router.route("/")
    .get(getAllUsers)
    .post(registerUser)
router.route("/:_id")
    .get(getSingleUser)
    .patch([authorizeRoles("admin", "user", "staff", "manager"), ensureSamePerson], updateUser)
    .delete([authorizeRoles("admin", "user", "staff", "manager"), ensureSamePerson], removeUser)
router.route("/:_id/reviews")
    .get(getAllReviewBySingleUser)
    .post([authorizeRoles("user"), ensureSamePerson], reviewProduct)
router.route("/:_id/reviews/:reviewID")
    .get(getASingleReviewByUser)
    .patch([authorizeRoles("user"), ensureSamePerson], updateASingleReviewBySingleUser)
    .delete([authorizeRoles("user", "admin", "staff", "manager"), ensureSamePerson], deleteASingleReview)






module.exports = router