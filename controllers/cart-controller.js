const { StatusCodes } = require("http-status-codes")
const { BadRequestError, NotFoundError, Conflict } = require("../errors")
const { Cart, Book } = require("../models")



const addItemToCart = async (req, res) => {
    const { userID: personID, sessionID, } = req.user
    const { role: userRole } = req.user
    const personModel = (userRole) ? userRole[0].toUpperCase() + userRole.slice(1) : null

    const { productID, quantity, couponCode } = req.body

    //Body validation
    if (!productID) {
        throw new BadRequestError("Please provide a value for productID")
    }
    if (!quantity) {
        throw new BadRequestError("Please provide a value for quantity")
    }

    const book = await Book.findOne({ _id: productID, deleted: false })
    if (!book) {
        throw new NotFoundError(`productID: ${productID} does not match any record`)
    }
    if (quantity > book.inventory) {
        throw new BadRequestError(`The 'quantity': ${quantity} exceeds inventory`)
    }
    let existingCart = await Cart.find({ $or: [{ active: true, sessionID }, { active: true, personID }] })


    //existingCart validation
    var newCart
    if (existingCart.length > 1) {
        //log this as error
        throw new Conflict("Multiple carts found")
    } else if (existingCart.length === 0) {
        //Creates a new cart because no active cart exists
        newCart = await new Cart({
            products: [{
                productID: productID,
                quantity: quantity,
                sessionID: sessionID,
            }],
            personID,
            personSchema: (personID) ? personModel : "User",
            sessionID
        }).save()
    } else if (existingCart.length === 1) {
        //Cart exists, so push the new book to it.
        let r = existingCart[0]
        r.products.push({
            productID,
            quantity: quantity,
            sessionID: sessionID,
        })
        r.personID = (!r.personID && personID) ? personID : null
        newCart = await r.save()
    }
    let populatedCart = await newCart.populate(["products.productID", "sessionID"])

    res.status(StatusCodes.CREATED).json({ result: populatedCart, msg: "Successfully added item to cart", success: true })

}


const decreaseCartItemQuantityByOne = async (req, res) => {
    const { userID: personID, sessionID } = req.user
    const { productID } = req.body

    //Body validation
    if (!productID) {
        throw new BadRequestError("Please provide a value for productID")
    }

    const book = await Book.findOne({ _id: productID, deleted: false })
    if (!book) {
        throw new NotFoundError(`productID: ${productID} does not match any record`)
    }

    let existingCart = await Cart.find({ $or: [{ active: true, personID: personID }, { active: true, sessionID: sessionID }] })


    if (!existingCart) {
        throw new BadRequestError("Item must be added to cart before it's quantity can be decreased")
    }


    existingCart.products.forEach(item => {
        if (String(item.productID) === productID)
            item.quantity -= 1
    })

    let result = await existingCart.save()
    await result.populate("products.productID")
    res.status(StatusCodes.OK).json({ result: result, msg: "Successfully decreased quantity by 1", success: true })



}
const viewAllActiveCart = async (req, res) => {
    /*Deleting the active query parameter and calling `viewAllCarts` will result in active=true*/
    delete req.query.active

    await viewAllCarts(req, res)
}


const viewAllCarts = async (req, res) => {
    const { userID: personID, sessionID } = req.user
    const { active = true } = req.query
    let allCarts = await Cart.find({ $or: [{ personID, active }, { sessionID, active }] }).populate("products.productID")
    res.status(StatusCodes.OK).json({ result: allCarts, msg: "Successfully returned all user carts", success: true })
}

const removeAnItemFromActiveCart = async (req, res) => {
    const { productID } = req.body
    const { userID: personID, sessionID } = req.user
    if (!productID) {
        throw new BadRequestError("`productID` is a required parameter")
    }
    let cart = await Cart.findOne({ $or: [{ active: true, personID }, { active: true, sessionID }] })
    if (!cart) {
        throw new NotFoundError(`User has no active cart`)
    }
    const modifiedProducts = []
    cart.products.forEach((prod) => {
        if (String(prod.productID) !== productID)
            modifiedProducts.push(prod)
    })
    cart.products = modifiedProducts
    await cart.save()

    res.status(StatusCodes.OK).json({ result: cart, success: true, message: "Successfully removed product from cart" })
}



module.exports = { addItemToCart, decreaseCartItemQuantityByOne, viewAllCarts, viewAllActiveCart, removeAnItemFromActiveCart }