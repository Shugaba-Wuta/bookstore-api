const express = require("express")
const router = express.Router()
const { getASingleSeller, getAllSellers, registerNewSeller, updateASeller, deleteASeller, deleteUploadedFiles } = require("../controllers/seller-controller")

const { authenticateUser, authorizeRoles, ensureSamePerson } = require("../middleware/auth middleware")


router.route("/").get(getAllSellers).post(registerNewSeller)
router.route("/:sellerID").get(getASingleSeller).patch([authorizeRoles("seller", "admin", "staff", "manager"), ensureSamePerson], updateASeller).delete([authorizeRoles("seller", "admin", "staff", "manager"), ensureSamePerson], deleteASeller)

router.route("/:sellerID/documents").delete(deleteUploadedFiles)







module.exports = router



