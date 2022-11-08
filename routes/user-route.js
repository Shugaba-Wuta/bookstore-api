const express = require("express")
const { authorizeRoles, ensureSameUserOrElevatedUser } = require("../middleware/auth middleware")
const { getAllUsers, registerUser, getSingleUser, updateUser, removeUser, updateASingleReviewBySingleUser, getASingleReviewByUser, getAllReviewBySingleUser, reviewProduct, deleteASingleReview } = require("../controllers/user-controller")



const router = express.Router()

router.route("/users")
    .get(getAllUsers)
    .post(registerUser)
router.route("/users/:_id")
    .get(getSingleUser)
    .patch([authorizeRoles("admin", "user", "staff", "manager"), ensureSameUserOrElevatedUser], updateUser)
    .delete([authorizeRoles("admin", "user", "staff", "manager"), ensureSameUserOrElevatedUser], removeUser)
router.route("/users/:_id/reviews")
    .get(getAllReviewBySingleUser)
    .post([authorizeRoles("user"), ensureSameUserOrElevatedUser], reviewProduct)
router.route("/users/:_id/reviews/:reviewID")
    .get(getASingleReviewByUser)
    .patch([authorizeRoles("user"), ensureSameUserOrElevatedUser], updateASingleReviewBySingleUser)
    .delete([authorizeRoles("user", "admin", "staff", "manager"), ensureSameUserOrElevatedUser], deleteASingleReview)






module.exports = router