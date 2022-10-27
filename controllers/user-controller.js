const { StatusCodes } = require("http-status-codes")
const GenericResponse = require("../schema/generic-response")
const { User } = require("../models")
const { BadRequestError, CustomAPIError } = require("../errors")







const getAllUsers = async (req, res) => { }

const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body
    let response

    try {
        //Validate req body and create user in db
        await User.validate({ email, password, name, role })
        const newUser = await User.create({ email, password, name, role })
        response = new GenericResponse(message = "user was created succesully", result = [{ name: newUser.fullName, email: newUser.email, role: newUser.role }], resultInfo = { resultCount: 1 })


    } catch (err) {
        throw err

    }
    if (response.isValid()) {
        return res.status(StatusCodes.CREATED).json({ ...response.response })
    }
}

const getSingleUser = async (req, res) => { }

const updateUser = async (req, res) => { }

const removeUser = async (req, res) => { }











module.exports = { getAllUsers, registerUser, getSingleUser, updateUser, removeUser }