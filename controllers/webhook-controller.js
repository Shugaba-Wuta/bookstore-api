const { StatusCodes } = require("http-status-codes")

const handlePaystackWebhook = async (req, res) => {
    console.log(JSON.stringify(req.body))
    return res.status(StatusCodes.OK).json({})
}

module.exports = { handlePaystackWebhook }