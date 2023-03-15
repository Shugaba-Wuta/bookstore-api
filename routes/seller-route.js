const express = require("express")
const router = express.Router()


const guard = require("express-jwt-permissions")()
const { getASingleSeller, getAllSellers, registerNewSeller, updateASeller, deleteASeller, addDocsToSeller, getSellerDocs, deleteUploadedDocs, updateDocumentProp, addBankAccount, updateBankInfo, deleteBankInfo, getAllSellerBanks, } = require("../controllers/seller-controller")

const { isPersonAuthorized } = require("../middleware/auth middleware")


router.route("/").get(getAllSellers).post(registerNewSeller)
router.route("/:sellerID")
    .get([guard.check([["seller:read", "seller:write"], ["seller"], ["seller:read:basic"]])], getASingleSeller)
    .patch([guard.check([["seller:read", "seller:write"], ["seller"]]), isPersonAuthorized], updateASeller)
    .delete([guard.check([["seller:read", "seller:write"], ["seller"]]), isPersonAuthorized], deleteASeller)


router.route("/:sellerID/documents")
    .post(isPersonAuthorized, addDocsToSeller)
    .delete(isPersonAuthorized, deleteUploadedDocs)
    .get(isPersonAuthorized, getSellerDocs)
    .patch(isPersonAuthorized, updateDocumentProp)

router.route("/:sellerID/bankAccounts")
    .post(isPersonAuthorized, addBankAccount)
    .get(isPersonAuthorized, getAllSellerBanks)
    .delete(isPersonAuthorized, deleteBankInfo)
    .patch(isPersonAuthorized, updateBankInfo)





module.exports = router



