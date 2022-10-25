const validAuthor = async (array) => {
    return array.length > 0 && array.every((record) => { return typeof (record) === typeof (String) })
}
module.exports = { validAuthor }