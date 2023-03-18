const { StatusCodes } = require("http-status-codes")

const home = async (req, res) => {
    res.status(StatusCodes.OK).json({ message: "Welcome", success: true, })
}


module.exports = { home }