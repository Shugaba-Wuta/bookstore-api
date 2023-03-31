const express = require("express")

const { isPersonAuthorized } = require("../middleware/auth middleware")
const { getAllUsers, registerUser, getSingleUser, updateUser, removeUser } = require("../controllers/user-controller")



const router = express.Router()

router.route("/")
    .get(getAllUsers)
    .post(registerUser)

router.route("/:userID")
    .get([isPersonAuthorized], getSingleUser)
    .patch([isPersonAuthorized], updateUser)
    .delete([isPersonAuthorized], removeUser)

module.exports = router