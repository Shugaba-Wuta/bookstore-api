const express = require("express")
const guard = require('express-jwt-permissions')()

const { isPersonAuthorized } = require("../middleware/auth middleware")
const { getAllUsers, registerUser, getSingleUser, updateUser, removeUser } = require("../controllers/user-controller")



const router = express.Router()

router.route("/")
    .get(getAllUsers)
    .post(registerUser)

router.route("/:userID")
    .get([guard.check([["user:read"], ["user"]]), isPersonAuthorized], getSingleUser)
    .patch([guard.check(["user:write", "user:read"]), isPersonAuthorized], updateUser)
    .delete([guard.check([["user:write", "user:read"], ["user"]]), isPersonAuthorized], removeUser)

module.exports = router