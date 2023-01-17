const { StatusCodes } = require("http-status-codes/build/cjs/status-codes")
const { BadRequestError, NotFoundError } = require("../errors")
const { Cart, Book } = require("../models")






const addItemToCart = async (req, res) => {
    const sessionID = req.user.sessionID
    const personID = req.user.userID
    const userRole = req.user.role
    const personModel = (userRole) ? userRole[0].toUpperCase() + userRole.slice(1) : null

    const { bookID, quantity } = req.body

    //Body validation
    if (!bookID) {
        throw new BadRequestError("Please provide a value for bookID")
    }
    if (!quantity) {
        throw new BadRequestError("Please provide a value for quantity")
    }

    const book = await Book.findOne({ _id: bookID, deleted: false })
    if (!book) {
        throw new NotFoundError(`bookID: ${bookID} does not match any record`)
    }
    if (quantity > book.inventory) {
        throw new BadRequestError(`The 'quantity': ${quantity} exceeds inventory`)
    }
    let existingCart
    if (personID) {
        existingCart = await Cart.find({ active: true, personID: personID })
    } else if (sessionID) {
        existingCart = await Cart.find({ active: true, sessionID: sessionID })
    }

    //existingCart validation
    var newCart
    if (existingCart.length > 1) {
        //log this as error
        throw new BadRequestError("Multiple carts found")
    } else if (existingCart.length === 0) {
        //Creates a new cart because no active cart exists
        newCart = await new Cart({
            products: [{
                productID: bookID,
                quantity: quantity,
                sessionID: sessionID,
                unwanted: "I am unwanted field "
            }],
            personID: personID,
            personSchema: (personID) ? personModel : "User",
            sessionID: sessionID
        }).save()
    } else if (existingCart.length === 1) {
        //Cart exists, so push the new book to it.
        let r = existingCart[0]
        r.products.push({
            productID: bookID,
            quantity: quantity,
            sessionID: sessionID,
        })
        newCart = await r.save()
    }
    let populatedCart = await newCart.populate({ path: "products.productID" })



    res.status(StatusCodes.CREATED).json({ result: populatedCart, msg: "Successfully added item to cart", success: true })

}


const decreaseCartItemQuantityByOne = async (req, res) => {
    const sessionID = req.user.sessionID
    const personID = req.user.userID

    const { bookID } = req.body

    //Body validation
    if (!bookID) {
        throw new BadRequestError("Please provide a value for bookID")
    }

    const book = await Book.findOne({ _id: bookID, deleted: false })
    if (!book) {
        throw new NotFoundError(`bookID: ${bookID} does not match any record`)
    }

    let existingCart
    if (personID) {
        existingCart = await Cart.findOne({ active: true, personID: personID })
    } else if (sessionID) {
        existingCart = await Cart.findOne({ active: true, sessionID: sessionID })
    }

    if (!existingCart) {
        throw new BadRequestError("Item must be added to cart before it's quantity can be decreased")
    }


    existingCart.products.forEach(item => {
        if (String(item.productID) === bookID)
            item.quantity -= 1
    })

    let result = await existingCart.save()
    await result.populate("products.productID")
    res.status(StatusCodes.OK).json({ result: result, msg: "Successfully decreased quantity by 1", success: true })



}


const viewAllCarts = async (req, res) => {
    const { userID } = req.params
    const { sessionID, active = true } = req.query
    if (!userID) {
        throw new BadRequestError("Please provide a userID in ")
    }
    const allCarts = await Cart.find({ personID: userID, active })
    if (sessionID) {
        const moreCarts = await Cart.find({ sessionID, active })
        allCarts.push(...moreCarts)
    }
    let result = await allCarts.save()

    result = await result.populate("products.productID")

    res.status(StatusCodes.OK).json({ result: result, msg: "Successfully returned all user carts" })
}



module.exports = { addItemToCart, decreaseCartItemQuantityByOne, viewAllCarts }