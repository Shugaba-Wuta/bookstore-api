"use strict"
const { StatusCodes } = require("http-status-codes")
const { User, } = require("../models")
const crypto = require("crypto")
const path = require("path")
const { BadRequestError, NotFoundError, Conflict } = require("../errors")
const mongoose = require("mongoose")
const RESULT_LIMIT = 50
const FORBIDDEN_FIELDS = ["__v", "password", "createdAt", "updatedAt", "kind", "deletedOn", "deleted", "permissions"]
const DEFAULT_USER_SORT_OPTIONS = { "firstName": 1, "createdAt": 1 }
const POSSIBLE_USER_SORT_OPTIONS = ["createdAt", "email", "firstName", "lastName", "middleName"]
const { uploadFileToS3 } = require("../utils/generic-utils")



const getAllUsers = async (req, res) => {
    const { sort, fields, query: queryString } = req.query
    //Users can only access undeleted users
    const queryObject = { deleted: false }
    let query = User.find(queryObject)


    if (queryString) {
        queryObject.$text = { $search: queryString }
        query = User.find(queryObject)
        query.sort({ $meta: "textScore" })
    } else {
        query.sort(DEFAULT_USER_SORT_OPTIONS)
    }
    if (sort) {
        const sortArray = (sort instanceof Array) ? sort : [sort]
        query.sort(sortArray.filter(item => { return POSSIBLE_USER_SORT_OPTIONS.includes(item) }))
    }
    if (fields) {
        const finalQueryFields = fields.replace(/\s/g, "")
            .split(",")
            .filter((item) => {
                // Ensure forbidden fields are not included
                return !FORBIDDEN_FIELDS.includes(item)
            })
            .join(" ")
        query = query.select(finalQueryFields)
    } else {
        query = query.select("firstName lastName middleName fullName email phoneNumber")
    }

    const userLimit = Number(req.query.limit)
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1
    const limit = (userLimit <= RESULT_LIMIT && userLimit > 0) ? userLimit : RESULT_LIMIT
    const skip = (page - 1) * limit

    query = query.limit(limit).skip(skip)
    const dbUser = await query
    return res.status(StatusCodes.OK).json({ success: true, message: "fetched users", result: dbUser, page: page })

}

const registerUser = async (req, res) => {
    // User sign up endpoint.
    const { firstName, lastName, middleName, email, password } = req.body
    const dbUser = await User.findOne({ email: email.toLowerCase() })
    if (dbUser) {
        throw new Conflict("email already exists.You may consider logging in")
    }
    const newUser = new User({ firstName, lastName, middleName, email, password })
    await newUser.save()
    return res.status(StatusCodes.OK)
        .json(
            {
                message: `User was created successfully`,
                success: true,
                result: [{ fullName: newUser.fullName, email: newUser.email, role: newUser.role }]
            })
}


const getSingleUser = async (req, res) => {
    const { userID } = req.params
    const dbUser = await User.findOne({ _id: mongoose.Types.ObjectId(userID), deleted: false })
        // Ensure sensitive fields (password, createdAt...) are not returned from DB
        .select(String(FORBIDDEN_FIELDS
            .map((item) => { return "-" + String(item) })
            .join(" ")))
    if (!dbUser) {
        throw new NotFoundError(`No user with ID: ${userID}`)
    }
    return res.status(StatusCodes.OK).json({ message: "fetched User", status: true, result: [dbUser] })
}

const updateUser = async (req, res) => {
    // Only user can update their account. Elevated updates are done via the staff the interface
    const { userID } = req.params
    const updateParams = {}
    const imagePath = ["uploads", req.user.role, req.user.userID].join("-")
    const updatableUserTextFields = ["firstName", "lastName", "middleName", "gender"]
    const { avatar } = req.files || {}

    if (avatar) {
        const avatarArray = (avatar instanceof Array) ? avatar : [avatar]
        if (avatarArray.length > 1) {
            throw new BadRequestError("Avatar must be a single file")
        }
        const docs = avatarArray.map(doc => {
            var name = [imagePath, crypto.randomBytes(12).toString("hex"), path.extname(doc.name)].join("-")
            return { name, data: doc.data }
        })
        let publicUrl = await uploadFileToS3(docs)
        if (publicUrl.length > 0) {
            updateParams.$set.avatar = { ...publicUrl[0] }
        }
    }

    //Fetch and set all updatable text fields from request body
    Object.keys(req.body).forEach((reqBody) => {
        if (updatableUserTextFields.includes(reqBody) && req.body[reqBody]) {
            updateParams.$set[reqBody] = req.body[reqBody]
        }
    })
    const dbUser = await User.findOneAndUpdate({ _id: userID, deleted: false }, updateParams, { new: true })
    if (!dbUser) {
        throw new NotFoundError(`No user with the id: ${userID}`)
    }
    res.status(StatusCodes.OK).json({ message: "user update was successful", success: true, result: dbUser })
}

const removeUser = async (req, res) => {
    const { userID } = req.params
    const userInDB = await User.findOneAndUpdate({ _id: userID, deleted: false }, { deleted: true, deletedOn: Date.now() })
    if (!userInDB) {
        throw new NotFoundError(`No user with the id: ${userID}`)
    }
    res.status(StatusCodes.OK).json({ message: "User has successfully  been deleted", success: true })
}







module.exports = { getAllUsers, registerUser, getSingleUser, updateUser, removeUser }