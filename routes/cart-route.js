const express = require("express")
const { addItemToCart, updateCartItem, viewAllCarts, removeAnItemFromActiveCart } = require("../controllers/cart-controller")


const router = express.Router()



router.route("/cart")
    .post(addItemToCart)
    .patch(updateCartItem)
    .delete(removeAnItemFromActiveCart)
router.route("/:userID")
    .get(viewAllCarts)

module.exports = router