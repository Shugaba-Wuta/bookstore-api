const express = require("express")

const { addAddress, updateAddress, getAllSellerAddress, deleteAddress } = require("../controllers/address-controller")


const router = express.Router()



router.route("/:personID")
    .get(getAllSellerAddress)
    .post(addAddress)
    .patch(updateAddress)
    .delete(deleteAddress)


module.exports = router

