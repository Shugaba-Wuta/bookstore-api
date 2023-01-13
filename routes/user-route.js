const express = require("express")
const guard = require('express-jwt-permissions')()

const { isPersonAuthorized } = require("../middleware/auth middleware")
const { getAllUsers, registerUser, getSingleUser, updateUser, removeUser, updateASingleReviewBySingleUser, getASingleReviewByUser, getAllReviewBySingleUser, reviewProduct, deleteASingleReview } = require("../controllers/user-controller")



const router = express.Router()

router.route("/")
    .get(getAllUsers)
    .post(registerUser)

router.route("/:userID")
    .get([guard.check([["user:read"], ["user"]]), isPersonAuthorized], getSingleUser)
    .patch([guard.check(["user:write", "user:read"]), isPersonAuthorized], updateUser)
    .delete([guard.check([["user:write", "user:read"], ["user"]]), isPersonAuthorized], removeUser)
router.route("/:userID/reviews")
    .get(getAllReviewBySingleUser)
    .post([guard.check([["book:review", "user:read", "user:write"], ["book", "user"]["book:review", "user:read", "user:write"], ["book", "user"]]), isPersonAuthorized], reviewProduct)
router.route("/:userID/reviews/:reviewID")
    .get(getASingleReviewByUser)
    .patch([guard.check([["book:review", "user:read", "user:write"], ["book", "user"]]), isPersonAuthorized], updateASingleReviewBySingleUser)
    .delete([guard.check([["book:review", "user:read", "user:write"], ["book", "user"]]), isPersonAuthorized], deleteASingleReview)






module.exports = router