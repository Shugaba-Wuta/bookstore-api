"use strict"
const { StatusCodes } = require("http-status-codes")
const GenericResponse = require("../schema/generic-response")
const { User, Seller, Address } = require("../models")
const { BadRequestError, CustomAPIError, NotFoundError, UnauthorizedError } = require("../errors")
const mongoose = require("mongoose")
const RESULT_LIMIT = 50
const FORBIDDEN_FIELDS = ["__v", "password", "createdAt", "updatedAt", "kind", "documents"]




const getAllUsers = async (req, res) => {
    const { active, role, verified, sort, fields, minRating, maxRating } = req.query
    const queryObject = {}
    if (String(active) !== "undefined") {
        queryObject.active = Boolean(active)
    }
    if (role) {
        queryObject.role = role
    }
    if (String(verified) !== "undefined") {
        queryObject.verified = Boolean(verified)
    }
    if (minRating && Number(minRating) > 0) {
        queryObject.rating = {}
        queryObject.rating["$gte"] = Number(minRating)
    }
    if (maxRating && Number(maxRating) > 0) {
        if (!queryObject.rating) {
            queryObject.rating = {}
        }
        queryObject.rating["$lte"] = Number(maxRating)
    }
    let query = Seller.find(queryObject)

    if (sort) {
        const DEFAULT_SORT = "name"
        const finalSortList = (sort) => {
            const SORT_OPTIONS = ["rating", "created_at", "role", "email"].flatMap((item) => { return [item, `-${item}`] })
            const sortList = sort.replace(/\s/g, "").split(",")
            const newSortList = sortList.filter((sort) => {
                return SORT_OPTIONS.includes(sort)
            })
            return newSortList.join(" ")
        }
        const finalSort = finalSortList(sort)
        query = query.sort(finalSort || DEFAULT_SORT)
    }
    if (fields) {
        const userFields = fields.replace(/\s/g, "")
            .split(",")
            .filter((item) => {
                // Ensure forbidden fields are not included
                return !FORBIDDEN_FIELDS.includes(item)
            })
            .join(" ")
        query = query.select(userFields)
    } else {
        query = query.select("name email phoneNumber active verified")
    }


    const userLimit = Number(req.query.limit)
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1
    const limit = (userLimit <= RESULT_LIMIT && userLimit > 0) ? userLimit : RESULT_LIMIT
    const skip = (page - 1) * limit

    query = query.limit(limit).skip(skip)

    const dbUser = await query

    return res.status(StatusCodes.OK).json({ success: true, message: "fectched users", result: dbUser, page: page })


}

const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body
    let response

    try {
        //Validate req body and create user in db
        await User.validate({ email, password, name, role })
        const newUser = await User.create({ email, password, name, role })
        response = new GenericResponse("user was created succesully", [{ name: newUser.fullName, email: newUser.email, role: newUser.role }], { resultCount: 1 })


    } catch (err) {
        throw err

    }
    if (response.isValid()) {
        return res.status(StatusCodes.CREATED).json({ ...response.response })
    }
}

const getSingleUser = async (req, res) => {
    const { _id: userID } = req.params
    const dbUser = await User.findOne({ _id: mongoose.Types.ObjectId(userID) })
        // Ensure sensitive fields are not returned from DB
        .select(String(FORBIDDEN_FIELDS
            .map((item) => { return "-" + String(item) })
            .join(" ")))
    if (dbUser.length < 1) {
        throw new NotFoundError(`No user with ID: ${userID}`)
    }
    return res.status(StatusCodes.OK).json({ message: "fetched User", status: true, result: [dbUser] })
}

const updateUser = async (req, res) => {
    //Requires authentication and authorization 
    const { _id: userID } = req.params
    const { active, name, verified, gender, avatar, account, BVN, NIN, documents, address, phoneNumber } = req.body
    //Setting up the DB fields each can update.
    const baseUpdateAccess = ["name", "avatar", "active", "address"]
    const roleBasedUpdateAccess = {
        user: baseUpdateAccess,
        staff: baseUpdateAccess.concat("verified", "active", "BVN", "NIN", "documents", "gender", "phoneNumber"),
        updateStaffSeller() {
            this.seller = this.staff
            this.manager = this.staff
        }
    }
    roleBasedUpdateAccess.updateStaffSeller()

    const queryObject = {}
    if (phoneNumber) {
        queryObject.phoneNumber = phoneNumber
    }
    if (address) {
        const newAddress = new Address(address)
        await newAddress.save()
        queryObject.address = newAddress
    }

    if (BVN) {
        queryObject.BVN = BVN
    }
    if (NIN) {
        queryObject.NIN = NIN
    }
    if (documents) {
        queryObject.documents = documents
    }
    if (String(active) !== "undefined") {
        queryObject.active = active
    }
    if (name) {
        queryObject.name = name
    }
    if (String(verified) !== "undefined") {
        queryObject.verified = verified
    }
    if (gender) {
        queryObject.gender = gender
    }
    if (avatar) {
        queryObject.avatar = avatar
    }
    if (account) {
        queryObject.account = account
    }


    const { role: requesterRole } = req.user

    //create a queryObject for a specified role
    const finalQueryObject = {}
    roleBasedUpdateAccess[`${requesterRole}`].forEach((field) => {
        if (String(queryObject[field]) !== "undefined") {
            finalQueryObject[field] = queryObject[field]
        }
    })
    //Update record in DB
    const userInDB = await User.findOneAndUpdate({ _id: userID }, finalQueryObject,
        {
            returnOriginal: false,
            runValidators: true,
            // lean: true,
            fields: String(FORBIDDEN_FIELDS
                .map((item) => { return "-" + String(item) })
                .join(" "))
        })

    res.status(200).json({ result: [userInDB] })





}

const removeUser = async (req, res) => {
    const { _id: userID } = req.params

    const userInDB = await User.findOneAndUpdate({ _id: userID }, { active: false })
    res.status(StatusCodes.OK).json({ message: "User has successfully deleted", success: true })
}











module.exports = { getAllUsers, registerUser, getSingleUser, updateUser, removeUser }