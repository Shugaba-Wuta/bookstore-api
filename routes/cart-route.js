const express = require("express")
const { addItemToCart, decreaseCartItemQuantityByOne, viewAllCarts, viewAllActiveCart, removeAnItemFromActiveCart } = require("../controllers/cart-controller")
const guard = require("express-jwt-permissions")()


const router = express.Router()



router.route("/cart")
    .post(addItemToCart)
    .patch(decreaseCartItemQuantityByOne)
    .delete(removeAnItemFromActiveCart)
router.route("/")
    //TODO #11 Require an escalated role using
    .get(guard.check(["cart"]), viewAllCarts)
router.route("/active")
    .get(viewAllActiveCart)
module.exports = router