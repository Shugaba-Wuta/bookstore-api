"use strict"
const { StatusCodes } = require("http-status-codes")
const crypto = require("crypto")
const path = require("path")
const { Seller, Document, BankAccount, Address } = require("../models")
const { Conflict, NotFoundError, BadRequestError } = require("../errors")
const { RESULT_LIMIT } = require("../config/app-data")
const { USER_FORBIDDEN_FIELDS: FORBIDDEN_FIELDS } = require("../config/app-data")
const { uploadFileToS3 } = require("../utils/generic-utils")
const { isBankAccountValid, createASubaccount } = require("../utils/paystack-utils")
const { nigerianCommercialBanks } = require("../config/app-data")


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
        throw new Conflict("email already exists. You may consider logging in")
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
        .select(FORBIDDEN_FIELDS).populate(["addresses", "bankAccounts", "documents"])
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
    const oldSeller = await Seller.findById(sellerID)
    if (!oldSeller) {
        throw new NotFoundError(`No user exists with the userID: ${sellerID}`)
    }
    const updatableTextFields = ["firstName", "lastName", "middleName", "gender", "NIN", "phoneNumber"]
    const { avatar } = req.files || {}

    Object.keys(req.body).forEach(param => {
        if (updatableTextFields.includes(param)) {
            oldSeller[param] = req.body[param]
        }
    })
    if (avatar) {
        const avatarArray = (avatar instanceof Array) ? avatar : [avatar]
        if (avatarArray.length > 1) {
            throw new BadRequestError("Avatar must be a single file")
        }
        const docs = avatarArray.map(doc => {
            const imagePath = ["uploads", "seller", sellerID].join("-")
            var name = [imagePath, crypto.randomBytes(12).toString("hex") + path.extname(doc.name)].join("-")
            return { name, data: doc.data }
        })
        let publicUrl = await uploadFileToS3(docs)
        if (publicUrl.length) {
            oldSeller.avatar = { ...publicUrl[0] }
        }
    }

    const newSeller = await oldSeller.save({}).select(FORBIDDEN_FIELDS)

    res.status(StatusCodes.OK).json({ message: "Seller was updated successfully", success: true, result: newSeller })


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


/*
    SELLER/DOCUMENTS  MANIPULATION.
*/


const addDocsToSeller = async (req, res) => {
    const { pictures, govtIssuedID, others } = req.files || {}
    const { sellerID } = req.params
    const imagePath = ["uploads", "seller", sellerID].join("-")
    const newDocs = []
    if (!sellerID) {
        throw new BadRequestError("sellerID is a required parameter")
    }
    if (govtIssuedID) {
        const govtIssuedIDArray = (govtIssuedID instanceof Array) ? govtIssuedID : [govtIssuedID]
        const docs = govtIssuedIDArray.map(doc => {
            var name = [imagePath, crypto.randomBytes(12).toString("hex") + path.extname(doc.name)].join("-")
            return { name, data: doc.data }
        })
        let publicUrls = await uploadFileToS3(docs)
        if (publicUrls.length) {
            for await (const url of publicUrls) {
                const newID = await new Document({ category: "govtIssuedID", ...url }).save()
                newDocs.push(newID)
            }
        }

    }
    if (pictures) {
        const picturesArray = (pictures instanceof Array) ? pictures : [pictures]
        let docs = picturesArray.map(doc => {
            var name = [imagePath, crypto.randomBytes(12).toString("hex") + path.extname(doc.name)].join("-")
            return { name, data: doc.data }
        })
        let publicUrls = await uploadFileToS3(docs)
        for await (const url of publicUrls) {
            const newPics = await new Document({ category: "pictures", ...url }).save()
            newDocs.push(newPics)
        }
    }
    if (others) {
        const othersArray = (others instanceof Array) ? others : [others]
        let docs = othersArray.map(doc => {
            var name = [imagePath, crypto.randomBytes(12).toString("hex") + path.extname(doc.name)].join("-")
            return { name, data: doc.data }
        })
        let publicUrls = await uploadFileToS3(docs)
        for await (const url of publicUrls) {
            const newOther = await new Document({ category: "others", ...url })
            newDocs.push(newOther)
        }
    }

    res.status(StatusCodes.CREATED).json({ result: newDocs, message: "Successfully uploaded documents", success: true })


}
const getSellerDocs = async (req, res) => {
    const { sellerID } = req.params
    if (!sellerID) {
        throw new BadRequestError("sellerID is a required field")
    }
    const allDocs = await Document.find({ person: sellerID, deleted: false })
    res.status(StatusCodes.OK).json({ result: allDocs, message: "Successfully returned seller documents", success: true })
}
const deleteUploadedFiles = async (req, res) => {
    const { sellerID } = req.params
    const { documentID: docID } = req.body
    if (!sellerID) {
        throw new BadRequestError(`Please provide a valid sellerID `)
    }
    if (!docID) {
        throw new BadRequestError(`Please provide a valid docID`)
    }
    const doc = await Document.findOne({ _id: docID, person: sellerID })
    if (!doc) {
        throw new NotFoundError("docID matches no record")
    }
    await Document.findOneAndUpdate({ _id: docID, person: sellerID }, { deleted: true, deletedOn: Date.now() })
    return res.status(StatusCodes.OK).json({ result: [], message: "Successfully deleted document", success: true })
}

const updateDocumentProp = async (req, res) => {
    const { sellerID } = req.params
    const { documentID: docID, category, refID } = req.body
    if (!docID) {
        throw new BadRequestError("documentID field is required")
    }
    if (!sellerID) {
        throw new BadRequestError("sellerID field is required")
    }
    const doc = Document.findOne({ _id: docID, person: sellerID })

    if (refID) {
        doc.refID = refID
    }
    if (category) {
        doc.category = category
    }
    const newDoc = await doc.save()
    res.status(StatusCodes.OK).json({ result: newDoc, message: 'Successfully updated record', success: true })
}

/*
SELLER/ BANK ACCOUNTS MANIPULATION
*/


const addBankAccount = async (req, res) => {
    const { sellerID } = req.params
    const { BVN, accountName: name, email, accountNumber: number, bankName, firstName, lastName, middleName, accountType: type } = req.body
    if (!sellerID) {
        throw new BadRequestError("Please provide a sellerID")
    }
    const bankDetails = nigerianCommercialBanks.filter(item => {
        return item.name === bankName
    })
    if (!bankDetails) {
        throw new BadRequestError("Please provide a valid bankName")
    }
    const code = bankDetails.code
    //Verify provided bank Info using pay-stack
    const bankValid = await isBankAccountValid(number, code, firstName, lastName, name)
    if (!bankValid) {
        throw new BadRequestError("Bank information provided is not valid")
    }
    // Create paystack subaccount
    const business_name = name || [firstName, lastName].join(" ")
    const subaccountResponse = await createASubaccount({ bank_code: code, business_name, account_number: number, email })
    if (!subaccountResponse.status) {
        throw new BadRequestError("Could not create a subaccount with provided information")
    }

    var newAccount = new BankAccount({ BVN, number, bankName, code, type, verificationStatus: true, person: sellerID })
    if (type === "personal") {
        newAccount.firstName = firstName
        newAccount.lastName = lastName
        newAccount.middleName = middleName
    } else if (type === "business") {
        newAccount.name = name
    } else {
        throw new BadRequestError("Invalid accountType provided")
    }
    newAccount.subaccount = subaccountResponse.data.subaccount_code

    newAccount = await newAccount.save()
    return res.status(StatusCodes.CREATED).json({ success: true, result: newAccount, message: "Successfully created bank info" })
}

const updateBankInfo = async (req, res) => {
    const { sellerID } = req.params
    const { email, setDefault, bankID } = req.body


    if (!sellerID) {
        throw new BadRequestError("sellerID is a required field")
    }
    const oldBankInfo = await BankAccount.findOne({ person: sellerID, _id: bankID })
    if (!oldBankInfo) {
        throw new NotFoundError("No bankInfo found")
    }
    //Verify bankInfo
    if (email) {
        oldBankInfo.email = email
    }
    if (setDefault) {
        await BankAccount.updateMany({ person: sellerID, default: true }, { default: false })
        oldBankInfo.default = true
    }
    const updatedBankInfo = await oldBankInfo.save()
    res.status(StatusCodes.OK).json({ success: true, result: updatedBankInfo, message: "Successfully updated Bank Account" })
}

const deleteBankInfo = async (req, res) => {
    const { sellerID } = req.params
    const { bankID } = req.body

    if (!sellerID) {
        throw new BadRequestError("sellerID is a required field")
    }
    if (!bankID) {
        throw new BadRequestError("bankID is a required body parameter")
    }
    await BankAccount.findOneAndUpdate({
        person: sellerID, _id: bankID, deleted: false
    }, { deleted: true, deletedOn: Date.now() })

    res.status(StatusCodes.OK).json({ result: null, message: "Bank Account has been deleted", success: true })
}

const getAllSellerBanks = async (req, res) => {
    const { sellerID } = req.params

    if (!sellerID) {
        throw new BadRequestError("sellerID is a required field")
    }
    const allBankInfo = await BankAccount.find({ person: sellerID, deleted: false })
    res.status(StatusCodes.OK).json({ result: allBankInfo, message: "Successfully returned bank accounts", success: true })
}



/*

Seller Address manipulation

*/


const addAddress = async (req, res) => {
    const { sellerID } = req.params
    const { unit, street, city, LGA, state, zipCode, country = "Nigeria" } = req.body
    const personSchemaType = "Seller"

    if (!sellerID) {
        throw new BadRequestError("sellerID is a required field")
    }
    const newAddress = await new Address({ unit, street, city, LGA, state, zipCode, personSchemaType, person: sellerID, country }).save()

    res.status(StatusCodes.CREATED).json({ result: newAddress, message: "Successfully created address", success: true })
}

const updateAddress = async (req, res) => {
    const { sellerID } = req.params
    const { unit, street, city, LGA, state, zipCode, addressID, setDefault } = req.body
    if (!sellerID) {
        throw new BadRequestError("sellerID is a required field")
    }
    if (!addressID) {
        throw new BadRequestError("addressID is a required field")
    }
    const oldAddress = await Address.findOne({ _id: addressID, person: sellerID })
    if (!oldAddress) {
        throw new NotFoundError("No address matched request")
    }
    const fields = [unit, street, city, LGA, state, zipCode]
    fields.forEach(field => {
        if (field) {
            oldAddress[Object.keys(field)] = field
        }
    })
    if (setDefault) {
        await Address.updateMany({ person: sellerID, default: true }, { default: false })
        oldAddress.default = true
    }
    const updatedAddress = await oldAddress.save()

    res.status(StatusCodes.OK).json({ result: updatedAddress, message: "Successfully updated address", success: true })
}

const getAllSellerAddress = async (req, res) => {
    const { sellerID } = req.params
    if (!sellerID) {
        throw new BadRequestError("sellerID is a required field")
    }
    const addresses = await Address.find({ person: sellerID, deleted: false })
    res.status(StatusCodes.OK).json({ result: addresses, message: "Successfully returned address", success: true })
}

const deleteAddress = async (req, res) => {
    const { sellerID } = req.params
    const { addressID } = req.body

    if (!sellerID) {
        throw new BadRequestError("sellerID is a required field")
    }
    if (!addressID) {
        throw new BadRequestError("addressID is a required field")
    }
    await Address.findOneAndUpdate({ _id: addressID, person: sellerID, deleted: false }, { deleted: true, deletedOn: Date.now() })
    res.status(StatusCodes.OK).json({ result: null, success: true, message: "Successfully deleted address" })

}



const test = async (req, res) => {
    const response = await createASubaccount({ bank_code: "058", business_name: "Wuta Biz", account_number: "0253412518" })

    return res.status(200).json({ response })
}


module.exports = { getASingleSeller, getAllSellers, registerNewSeller, updateASeller, deleteASeller, addDocsToSeller, getSellerDocs, deleteUploadedFiles, updateDocumentProp, addBankAccount, updateBankInfo, deleteBankInfo, getAllSellerBanks, addAddress, updateAddress, getAllSellerAddress, deleteAddress, test }