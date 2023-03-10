// const nanoid = require("nanoid")
const { User, Coupon } = require("../models")
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
const couponValid = async (code, bookID) => {
    /*
        Returns coupon `id` if coupon is valid for given bookID
    */
    const coupon = await Coupon.findOne({ code, active: true })
    if (!code) {
        return null
    }
    const couponItems = coupon.items.map(item => { return String(item) })
    if (!couponItems.includes(String(bookID))) {
        return null
    }
    return coupon._id
}
module.exports = { staffIdGenerator, couponValid }