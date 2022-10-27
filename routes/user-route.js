const express = require("express")
const { getAllUsers, registerUser, getSingleUser, updateUser, removeUser } = require("../controllers/user-controller")



const router = express.Router()

router.route("/users").get(getAllUsers).post(registerUser)
router.route("/users/:id").get(getSingleUser).patch(updateUser).delete(removeUser)






module.exports = router