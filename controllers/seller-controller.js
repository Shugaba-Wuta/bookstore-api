"use strict"
const { StatusCodes } = require("http-status-codes")
const crypto = require("crypto")
const path = require("path")
const mongoose = require("mongoose")
const fs = require("fs")
const { Seller } = require("../models")
const { Conflict, NotFoundError } = require("../errors")
const { writeRequestFiles } = require("../utils/user-utils")



const RESULT_LIMIT = 50
const FORBIDDEN_FIELDS = { "password": 0, "deleted": 0, "deletedOn": 0, "createdAt": 0, "updatedAt": 0, "__v": 0 }


const getAllSellers = async (req, res) => {
    const DEFAULT_SORT = { firstName: 1, lastName: 1, createdAt: 1, }
    const SORT_OPTIONS = ["createdAt", "firstName", "lastName", "relevance"]
    const { q: queryString, verified, sort, fields } = req.query
    const queryParams = { deleted: false }

    if (String(verified) !== "undefined") {
        queryParams.verified = verified
    }
    if (queryString && sort === "relevance") {
        queryParams.$text = { $search: queryString }
    }
    const dbQuery = Seller.find(queryParams)
    if (sort) {
        let finalSort = {}
        sort.split(",").forEach(option => {
            option = option.trim()
            if (option.startsWith("-") && SORT_OPTIONS.includes(option.slice(1))) {
                finalSort[option.slice(1)] = -1
            } else if (!option.startsWith("-") && SORT_OPTIONS.includes(option)) {
                finalSort[option] = 1
            }
        })
        dbQuery.sort(finalSort)

    } else {
        dbQuery.sort(DEFAULT_SORT)
    }
    if (fields) {
        let finalQueryFields = {}
        fields.split(",").forEach(field => {
            field = field.trim()
            if (!Object.keys(FORBIDDEN_FIELDS).includes(field)) {
                finalQueryFields[field] = 1
            }
        })
        dbQuery.select(finalQueryFields)

    } else {
        dbQuery.select(FORBIDDEN_FIELDS)
    }

    const userLimit = Number(req.query.limit)
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1
    const limit = (userLimit <= RESULT_LIMIT && userLimit > 0) ? userLimit : RESULT_LIMIT
    const skip = (page - 1) * limit

    const dbSeller = await dbQuery.limit(limit).skip(skip)
    return res.status(StatusCodes.OK).json({ success: true, message: "fectched sellers", result: dbSeller, page: page })


}
const registerNewSeller = async (req, res) => {
    const { email, firstName, middleName, lastName, password } = req.body

    const dbSeller = await Seller.findOne({ email: email.toLowerCase() })
    if (dbSeller) {
        throw new Conflict("email already exists.You may consider loggin in")
    }
    const newUser = new Seller({ firstName, lastName, middleName, email, password })
    await newUser.save()
    return res.status(StatusCodes.OK)
        .json(
            {
                message: `Seller was created successfully`,
                success: true,
                result: [{ fullName: newUser.fullName, email: newUser.email, role: newUser.role }]
            })
}
const getASingleSeller = async (req, res) => {
    const { _id: sellerID } = req.params
    // Ensure sensitive fields (password, createdAt...) are not returned from DB
    const dbSeller = await Seller.findOne({ _id: mongoose.Types.ObjectId(sellerID), deleted: false })
        .select(FORBIDDEN_FIELDS)
    if (!dbSeller) {
        throw new NotFoundError(`No user with ID: ${sellerID}`)
    }
    return res.status(StatusCodes.OK).json({ message: "fetched Seller", status: true, result: [dbSeller] })
}
const upateASeller = async (req, res) => {
    //get sellerID from request parameter aka url
    const { _id: sellerID } = req.params
    const updatableTextFields = ["firstName", "lastName", "middleName", "gender", "NIN", "accountName", "accountNumber", "phoneNumber", "BVN", "bankName"]
    const { avatar, govtIssuedID, pictures } = req.files || {}
    let imagePath = path.join("uploads", "sellers", req.user.userID)

    const updateParams = { $set: {}, $push: {} }
    Object.keys(req.body).forEach(param => {
        if (updatableTextFields.includes(param)) {
            updateParams.$set[param] = req.body[param]
        }
    })
    if (avatar) {
        avatar.path = path.join(imagePath, "avatar-profile" + path.extname(avatar.name))
        updateParams.$set["avatar.path"] = avatar.path
    }
    if (govtIssuedID) {
        //Process multiple files differently. Array of govtIssuedIDs or just a single upload  
        if (govtIssuedID instanceof Array) {
            const multipleGovtIssuedID = govtIssuedID.map((doc) => {
                doc.path = path.join(imagePath, crypto.randomBytes(12).toString("hex") + path.extname(doc.name))
                return { path: doc.path, uploadedAt: Date.now() }
            })
            updateParams.$push["govtIssuedID"] = { $each: multipleGovtIssuedID }
        } else {
            govtIssuedID.path = path.join(imagePath, crypto.randomBytes(12).toString("hex") + path.extname(govtIssuedID.name))
            updateParams.$push["govtIssuedID"] = {
                path: govtIssuedID.path, uploadedAt: Date.now()
            }
        }
    }
    if (pictures) {
        //Process multiple files differently. Array of pictures or just a single upload  
        if (pictures instanceof Array) {
            const multiplePictures = pictures.map((doc) => {
                doc.path = path.join(imagePath, crypto.randomBytes(12).toString("hex") + path.extname(doc.name))
                return { path: doc.path }
            })
            updateParams.$push["pictures"] = { $each: multiplePictures }
        } else {
            pictures.path = path.join(imagePath, crypto.randomBytes(12).toString("hex") + path.extname(pictures.name))
            updateParams.$push["pictures"] = {
                path: pictures.path, uploadedAt: Date.now()
            }
        }
    }
    const dbSeller = await Seller.findOneAndUpdate({ _id: sellerID, deleted: false }, updateParams, { new: true }).select(FORBIDDEN_FIELDS)
    if (!dbSeller) {
        throw new NotFoundError(`No seller with id: ${sellerID}`)
    }
    //Write files on file system
    if (avatar) {
        fs.mkdir(imagePath, { recursive: true }, async (err) => {
            if (err) {
                throw err
            }
            await writeRequestFiles(avatar)
        })
    }
    if (govtIssuedID) {
        fs.mkdir(imagePath, { recursive: true }, async (err) => {
            if (err) {
                throw err
            }
            await writeRequestFiles(govtIssuedID)
        })
    }
    if (pictures) {
        fs.mkdir(imagePath, { recursive: true }, async (err) => {
            if (err) {
                throw err
            }
            await writeRequestFiles(pictures)
        })
    }
    res.status(StatusCodes.OK).json({ message: "Seller was updated successfully", success: true, result: dbSeller })


}
const deleteASeller = async (req, res) => {
    const { _id: sellerID } = req.params
    const dbSeller = await Seller.findOneAndUpdate({ _id: sellerID, deleted: false }, { deleted: true, deletedOn: Date.now() }, { new: true })

    if (!dbSeller) {
        throw new NotFoundError(`No seller matched the requested id: ${sellerID}`)
    }
    res.status(StatusCodes.OK).json({ message: "seller was deleted successfully", success: true })
}




module.exports = { getASingleSeller, getAllSellers, registerNewSeller, upateASeller, deleteASeller }