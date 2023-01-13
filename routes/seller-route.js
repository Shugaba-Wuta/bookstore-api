const express = require("express")
const router = express.Router()


const guard = require("express-jwt-permissions")()
const { getASingleSeller, getAllSellers, registerNewSeller, updateASeller, deleteASeller, deleteUploadedFiles } = require("../controllers/seller-controller")

const { isPersonAuthorized } = require("../middleware/auth middleware")


router.route("/").get(getAllSellers).post(registerNewSeller)
router.route("/:sellerID")
    .get([guard.check([["seller:read", "seller:write"], ["seller"], ["seller:read:basic"]])], getASingleSeller)
    .patch([guard.check([["seller:read", "seller:write"], ["seller"]]), isPersonAuthorized], updateASeller)
    .delete([guard.check([["seller:read", "seller:write"], ["seller"]]), isPersonAuthorized], deleteASeller)

router.route("/:sellerID/documents")
    .delete([guard.check([["seller:read", "seller:write"], ["seller"]]), isPersonAuthorized], deleteUploadedFiles)







module.exports = router



