const express = require("express")
const router = express.Router()
const { getASingleSeller, getAllSellers, registerNewSeller, upateASeller, deleteASeller } = require("../controllers/seller-controller")

const { authenticateUser, authorizeRoles, ensureSamePerson } = require("../middleware/auth middleware")


router.route("/").get(getAllSellers).post(registerNewSeller)
router.route("/:_id").get(getASingleSeller).patch([authorizeRoles("seller", "admin", "staff", "manager"), ensureSamePerson], upateASeller).delete([authorizeRoles("seller", "admin", "staff", "manager"), ensureSamePerson], deleteASeller)







module.exports = router



