

const express = require("express")
const guard = require("express-jwt-permissions")()

const { getAllBooks, getSingleBook, removeBook, registerBook, updateBook, } = require("../controllers/book-controller")
const { isPersonAuthorized } = require("../middleware/auth middleware")



const router = express.Router()



router.get("/", getAllBooks)


router.post("/", [guard.check([["seller:read", "seller:write"], ["seller"]]), isPersonAuthorized], registerBook)

router.get("/:bookID", getSingleBook)



router.patch("/:bookID", [guard.check([["seller:read", "seller:write"], ["seller"]]), isPersonAuthorized], updateBook)


router.delete("/:bookID", [guard.check([["seller:read", "seller:write"], ["seller"]]), isPersonAuthorized], removeBook)


module.exports = router