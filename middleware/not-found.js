const { NotFoundError } = require("../errors")
const url = require("url")
const notFound = (req, res) => { throw new NotFoundError(`Route ${req.method} ${url.parse(req.url).pathname} does not exist`) }
//res.status(404).send('Route does not exist')

module.exports = notFound
