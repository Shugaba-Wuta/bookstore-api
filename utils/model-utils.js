// const nanoid = require("nanoid")
const User = require("../models/User")
const { IDGeneratorInfo } = require("../config/app-data")


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
module.exports = { staffIdGenerator }