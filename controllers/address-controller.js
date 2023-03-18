const { Address } = require("../models")
const { BadRequestError, NotFoundError } = require("../errors")
const { StatusCodes } = require("http-status-codes")




const addAddress = async (req, res) => {
    const { personID } = req.params
    const { unit, street, city, LGA, state, zipCode, country = "Nigeria", role, setDefault = false } = req.body
    const personSchemaType = role ? String(role[0]).toUpperCase() + String(role).slice(1).toLowerCase() : null
    if (!personID) {
        throw new BadRequestError("personID is a required field")
    }
    if (setDefault) {
        await Address.updateMany({ personSchemaType, personID, default: true }, { default: false })
    }
    const newAddress = await new Address({ unit, street, city, LGA, state, zipCode, personSchemaType, person: personID, country }).save()

    res.status(StatusCodes.CREATED).json({ result: newAddress, message: "Successfully created address", success: true })
}

const updateAddress = async (req, res) => {
    const { personID } = req.params
    const { addressID, setDefault } = req.body
    if (!personID) {
        throw new BadRequestError("personID is a required field")
    }
    if (!addressID) {
        throw new BadRequestError("addressID is a required field")
    }
    const oldAddress = await Address.findOne({ _id: addressID, person: personID })
    if (!oldAddress) {
        throw new NotFoundError("No address matched request")
    }
    const fields = req.body
    delete fields.addressID
    Object.keys(fields).forEach(field => {
        if (fields[field]) {
            oldAddress[field] = fields[field]
        }
    })
    if (setDefault) {
        await Address.updateMany({ person: personID, default: true }, { default: false })
        oldAddress.default = true
    }
    const updatedAddress = await oldAddress.save()

    res.status(StatusCodes.OK).json({ result: updatedAddress, message: "Successfully updated address", success: true })
}

const getAllSellerAddress = async (req, res) => {
    const { personID } = req.params
    if (!personID) {
        throw new BadRequestError("personID is a required field")
    }
    const addresses = await Address.find({ person: personID, deleted: false })
    res.status(StatusCodes.OK).json({ result: addresses, message: "Successfully returned address", success: true })
}

const deleteAddress = async (req, res) => {
    const { personID } = req.params
    const { addressID } = req.body

    if (!personID) {
        throw new BadRequestError("personID is a required field")
    }
    if (!addressID) {
        throw new BadRequestError("addressID is a required field")
    }
    const deletedAddress = await Address.findOneAndUpdate({ _id: addressID, person: personID, deleted: false }, { deleted: true, deletedOn: Date.now() })

    if (!deletedAddress) {
        throw new NotFoundError("Address does not exist")
    }
    res.status(StatusCodes.OK).json({ result: null, success: true, message: "Successfully deleted address" })


}


module.exports = { addAddress, updateAddress, getAllSellerAddress, deleteAddress }