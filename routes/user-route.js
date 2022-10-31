const express = require("express")
const { authenticateUser, authorizeRoles, assignSessionID } = require("../middleware/auth middleware")
const { getAllUsers, registerUser, getSingleUser, updateUser, removeUser } = require("../controllers/user-controller")



const router = express.Router()

router.route("/users").get(getAllUsers).post(registerUser)
router.route("/users/:_id").get(getSingleUser).patch(authorizeRoles("admin", "user", "seller", "staff", "manager"), updateUser).delete(removeUser)






module.exports = router