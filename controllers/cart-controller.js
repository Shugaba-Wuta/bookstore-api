const { StatusCodes } = require("http-status-codes")
const { SUPER_ROLES } = require("../config/app-data")
const { BadRequestError, NotFoundError } = require("../errors")
const { Cart, Book } = require("../models")
const { getCouponDetail } = require("../utils/model-utils")


const addItemToCart = async (req, res) => {
    const { userID: personID, sessionID, role: userRole } = req.user
    //Capitalize first letter to match Model name
    const personModel = (userRole) ? userRole[0].toUpperCase() + userRole.slice(1) : null

    let { productID, quantity = 1, couponCode } = req.body

    //Body validation
    if (!productID) {
        throw new BadRequestError("Please provide a value for productID")
    }
    const book = await Book.findOne({ _id: productID, deleted: false })
    if (!book) {
        throw new NotFoundError(`productID: ${productID} does not match any record`)
    }
    if (quantity > book.inventory) {
        throw new BadRequestError(`The 'quantity': ${quantity} exceeds inventory`)
    }

    let cart = await Cart.findOne({ $or: [{ active: true, sessionID }, { active: true, personID }] })

    if (!cart) {
        //Create a new cart with the new product
        cart = await new Cart({
            products: [{
                productID,
                quantity,
                sessionID,
            }],
            personID,
            personSchema: (personID) ? personModel : "User",
            sessionID
        }).save()
    } else {
        //Add a product to cart
        cart.products.push({
            productID,
            quantity,
            sessionID,
        })
    }
    if (couponCode) {
        const { couponID, value, type } = await getCouponDetail({ code: couponCode, bookID: productID }) || {}
        if (couponID) {
            await cart.applyCoupon(couponID, value, type, productID)
        }
    }
    await cart.save()

    let populatedCart = await cart.populate(["products.productID"])

    res.status(StatusCodes.CREATED).json({ result: populatedCart, msg: "Successfully added item to cart", success: true })
}


const updateCartItem = async (req, res) => {
    const { userID: personID, sessionID } = req.user
    const { productID, couponCode, operation } = req.body

    //Body validation
    if (!productID) {
        throw new BadRequestError("Please provide a value for productID")
    }
    if (!operation || !["decrease", "coupon"].includes(operation)) {
        throw new BadRequestError("bad/ missing field: operation")
    }

    const book = await Book.findOne({ _id: productID, deleted: false })
    if (!book) {
        throw new NotFoundError(`productID: ${productID} does not match any record`)
    }

    var existingCart = await Cart.findOne({ $or: [{ active: true, personID: personID, "products.productID": { $in: [productID] } }, { active: true, sessionID: sessionID, "products.productID": { $in: [productID] } }] })

    if (!existingCart) {
        throw new BadRequestError("Item must be added to cart before it can be decreased")
    }

    for (const product of existingCart.products) {
        if (String(product.productID) === productID && operation === "decrease") {
            //decrease quantity
            product.quantity -= 1
        }
        const { couponID, value, type } = await getCouponDetail({ code: couponCode, bookID: productID }) || {}
        if (couponID) {
            existingCart.applyCoupon(couponID, value, type, product.productID)
        }
    }
    const itemsExists = existingCart.products.filter(item => {
        return item.quantity > 0
    })
    if (!itemsExists.length) {
        await Cart.findByIdAndDelete(String(existingCart._id))
        console.log(itemsExists.length)
        return res.status(StatusCodes.OK).json({ success: true, message: "Cart has been deleted", result: null })
    }
    let result = await existingCart.save()
    await result.populate("products.productID")
    res.status(StatusCodes.OK).json({ result: result, msg: "Successfully decreased quantity by 1", success: true })



}



const viewAllCarts = async (req, res) => {
    const { sessionID } = req.user
    const { userID: personID } = req.params
    let { active = true } = req.query
    let allCarts

    if (!SUPER_ROLES.includes(req.user.role)) {
        active = true
        let cart = await Cart.findOne({ $or: [{ personID, active }, { sessionID, active }] })//.populate("products.productID")
        if (!cart) {
            return res.status(StatusCodes.OK).json({ result: null, msg: "No item in cart yet", success: true })
        }
        cart = await Cart.filterDeletedProd(String(cart._id))
        return res.status(StatusCodes.OK).json({ result: cart, msg: "Successfully returned active user carts", success: true })
    }


    allCarts = await Cart.find({ $or: [{ personID, active }, { sessionID, active }] }).populate("products.productID")
    res.status(StatusCodes.OK).json({ result: allCarts, msg: "Successfully returned all user carts", success: true })
}

const removeAnItemFromActiveCart = async (req, res) => {
    const { productID } = req.body
    const { userID: personID, sessionID } = req.user
    if (!productID) {
        throw new BadRequestError("`productID` is a required parameter")
    }
    let cartUpdateInfo = await Cart.updateOne({
        $or:
            [{
                active: true, personID, "products.productID":
                    { $in: [productID] }
            },
            {
                active: true, sessionID, "products.productID":
                    { $in: [productID] }
            }]
    }, {
        $pull: { products: { productID } }
    })
    if (!cartUpdateInfo.modifiedCount) {
        throw new NotFoundError(`User has no active cart with productID: ${productID}`)
    }

    res.status(StatusCodes.OK).json({ result: null, success: true, message: "Successfully removed product from cart" })
}



module.exports = { addItemToCart, updateCartItem, viewAllCarts, removeAnItemFromActiveCart }