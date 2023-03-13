const express = require("express")
const { addItemToCart, updateCartItem, viewAllCarts, removeAnItemFromActiveCart } = require("../controllers/cart-controller")
// const guard = require("express-jwt-permissions")()


const router = express.Router()



router.route("/cart")
    .post(addItemToCart)
    .patch(updateCartItem)
    .delete(removeAnItemFromActiveCart)
router.route("/:userID")
    .get(viewAllCarts)

module.exports = router