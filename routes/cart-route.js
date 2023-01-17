const express = require("express")
const { addItemToCart, decreaseCartItemQuantityByOne, viewAllCarts } = require("../controllers/cart-controller")
const guard = require("express-jwt-permissions")()


const router = express.Router()



router.route("/cart")
    .post(addItemToCart)
    .patch(decreaseCartItemQuantityByOne)
router.route("/")
    //Require an escalated role using
    .get(guard.check(["cart"]), viewAllCarts)

module.exports = router