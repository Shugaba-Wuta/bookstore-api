const express = require("express")
const { home } = require("../controllers/index-controller")


const router = express.Router()


router.get("", home)

module.exports = router
