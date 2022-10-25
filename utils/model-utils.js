const nanoid = require("nanoid")
const User = require("../models/User")
const { IDGeneratorInfo } = require("../app-data")
const validAuthor = async (array) => {
    return array.length > 0 && array.every((record) => { return typeof (record) === typeof (String) })
}

const staffIdGenerator = async () => {
    const maxIDLength = String(IDGeneratorInfo.maxNumber).length
    while (true) {
        if (!IDGeneratorInfo) {
            throw Error("Admin please create IDGeneratorInfo in ./app-data.js")
        }

        let numberPart = String(IDGeneratorInfo.currentNumber + 1)
        let ID = IDGeneratorInfo.alphabetLabel + "0".repeat(maxIDLength - numberPart.length) + numberPart

        let idExist = User.find({ staffId: ID }).exists()
        if (!idExist) {
            return ID
        }
    }

}
module.exports = { validAuthor, staffIdGenerator }