"use strict"
const { StatusCodes } = require("http-status-codes")
const crypto = require("crypto")
const path = require("path")
const { Seller, Document } = require("../models")
const { Conflict, NotFoundError, BadRequestError } = require("../errors")
const { RESULT_LIMIT } = require("../config/app-data")
const { USER_FORBIDDEN_FIELDS: FORBIDDEN_FIELDS } = require("../config/app-data")
const { uploadFileToS3 } = require("../utils/generic-utils")


const getAllSellers = async (req, res) => {
    const DEFAULT_SORT = { firstName: 1, lastName: 1, createdAt: 1, }
    const SORT_OPTIONS = ["createdAt", "firstName", "lastName", "relevance"]
    const { query: queryString, verified, sortBy: sort, fields } = req.query
    const queryParams = { deleted: false }

    if (String(verified) !== "undefined") {
        queryParams.verified = verified
    }
    if (queryString) {
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
    //Select fields from user request
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
    return res.status(StatusCodes.OK).json({ success: true, message: "fetched sellers", result: dbSeller, page: page })


}
const registerNewSeller = async (req, res) => {
    const { email, firstName, middleName, lastName, password } = req.body

    const dbSeller = await Seller.findOne({ email: email.toLowerCase() })
    if (dbSeller) {
        throw new Conflict("email already exists.You may consider logging in")
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
    const { sellerID } = req.params
    if (!sellerID) {
        throw new BadRequestError(`Please provide a valid sellerID `)
    }
    const dbSeller = await Seller.findOne({ _id: sellerID, deleted: false })
        .select(FORBIDDEN_FIELDS)
    if (!dbSeller) {
        throw new NotFoundError(`No user with ID: ${sellerID}`)
    }
    return res.status(StatusCodes.OK).json({ message: "fetched Seller", status: true, result: [dbSeller] })
}
const updateASeller = async (req, res) => {
    //get sellerID from request parameter aka url
    const { sellerID } = req.params
    if (!sellerID) {
        throw new BadRequestError(`Please provide a valid sellerID `)
    }
    const updatableTextFields = ["firstName", "lastName", "middleName", "gender", "NIN", "accountName", "accountNumber", "phoneNumber", "BVN", "bankName"]
    const { avatar, govtIssuedID, pictures } = req.files || {}
    const imagePath = ["uploads", req.user.role, req.user.userID].join("-")

    const updateParams = { $set: {}, $push: {} }
    Object.keys(req.body).forEach(param => {
        if (updatableTextFields.includes(param)) {
            updateParams.$set[param] = req.body[param]
        }
    })
    if (avatar) {
        const avatarArray = (avatar instanceof Array) ? avatar : [avatar]
        if (avatarArray.length > 1) {
            throw new BadRequestError("Avatar must be a single file")
        }
        const docs = avatarArray.map(doc => {
            var name = [imagePath, crypto.randomBytes(12).toString("hex") + path.extname(doc.name)].join("-")
            return { name, data: doc.data }
        })
        let publicUrl = await uploadFileToS3(docs)
        if (publicUrl.length > 0) {
            updateParams.$set.avatar = { ...publicUrl[0] }
        }
    }
    if (govtIssuedID) {
        const govtIssuedIDArray = (govtIssuedID instanceof Array) ? govtIssuedID : [govtIssuedID]
        const docs = govtIssuedIDArray.map(doc => {
            var name = [imagePath, crypto.randomBytes(12).toString("hex") + path.extname(doc.name)].join("-")
            return { name, data: doc.data }
        })
        let publicUrls = await uploadFileToS3(docs)
        updateParams.$push["govtIssuedID"] = { $each: publicUrls }

    }
    if (pictures) {
        const picturesArray = (pictures instanceof Array) ? pictures : [pictures]
        let docs = picturesArray.map(doc => {
            var name = [imagePath, crypto.randomBytes(12).toString("hex") + path.extname(doc.name)].join("-")
            return { name, data: doc.data }
        })
        let publicUrls = await uploadFileToS3(docs)
        updateParams.$push["pictures"] = { $each: publicUrls }

    }
    const dbSeller = await Seller.findOneAndUpdate({ _id: sellerID, deleted: false }, updateParams, { new: true }).select(FORBIDDEN_FIELDS)
    if (!dbSeller) {
        throw new NotFoundError(`No seller with id: ${sellerID}`)
    }

    res.status(StatusCodes.OK).json({ message: "Seller was updated successfully", success: true, result: dbSeller })


}
const deleteASeller = async (req, res) => {
    const { sellerID } = req.params
    if (!sellerID) {
        throw new BadRequestError(`Please provide a valid sellerID `)
    }
    const dbSeller = await Seller.findOneAndUpdate({ _id: sellerID, deleted: false }, { deleted: true, deletedOn: Date.now() }, { new: true })

    if (!dbSeller) {
        throw new NotFoundError(`No seller matched the requested id: ${sellerID}`)
    }
    res.status(StatusCodes.OK).json({ message: "seller was deleted successfully", success: true })
}
const deleteUploadedFiles = async (req, res) => {
    const { sellerID } = req.params
    if (!sellerID) {
        throw new BadRequestError(`Please provide a valid sellerID `)
    }

    const { avatar, pictures, documents, govtIssuedID } = req.files || {}
    const sellerInDB = await Seller.findOne({ deleted: false, _id: sellerID })
    if (!sellerInDB) {
        throw new NotFoundError("No seller was found")
    }

    if (avatar) {
        sellerInDB.avatar = { path: null, uploadedAt: null }
    }
    if (pictures) {
        let pictureArray = pictures instanceof Array ? pictures : [pictures]

        sellerInDB.pictures.forEach((pics, index) => {
            if (pictureArray.includes(pics._id)) {
                sellerInDB.pictures[index].deleted = true
                sellerInDB.pictures[index].deletedOn = Date.now()
            }
        })

    }
    if (govtIssuedID) {
        let govtIssuedIDArray = govtIssuedID instanceof Array ? govtIssuedID : [govtIssuedID]

        sellerInDB.govtIssuedID.forEach((id, index) => {
            if (govtIssuedIDArray.includes(id._id)) {
                sellerInDB.govtIssuedID[index].deleted = true
                sellerInDB.govtIssuedID[index].deletedOn = Date.now()
            }
        })
    }
    if (documents) {
        let documentsArray = documents instanceof Array ? documents : [documents]

        await Document.updateMany({
            _id: {
                $in: documentsArray
            },
            user: sellerID
        }, {
            deleted: true, deletedOn: Date.now()
        })
    }
    // Save the seller instance
    await sellerInDB.save()
    return res.status(StatusCodes.OK).json({ message: "Delete was successful", success: true })

}




module.exports = { getASingleSeller, getAllSellers, registerNewSeller, updateASeller, deleteASeller, deleteUploadedFiles }