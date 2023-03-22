<<<<<<< HEAD
const { Review } = require("../models")

const createAReview = async (req, res) => {
    const { orderID, productID } = req.body

}
const updateReview = async (req, res) => {

}
const deleteReview = async (req, res) => {

}
const getReviews = async (req, res) => {

}
const getReview = async (req, res) => {
=======
const { StatusCodes } = require("http-status-codes")
const { BadRequestError, NotFoundError } = require("../errors")
const { Review } = require("../models")
const { uploadFileToS3 } = require("../utils/generic-utils")
const { SUPER_ROLES } = require("../config/app-data")
const path = require("path")
const crypto = require("crypto")

const createAReview = async (req, res) => {
    const { order, productID: product, userID: person, role, itemRating, title, comment, sellerRating } = req.body
    const { pictures } = req.files

    const personSchema = String(role)[0].toUpperCase() + String(role).substring(1).toLowerCase()
    const requiredFields = { personSchema, product, person, itemRating }
    //Basic verification
    const verificationErrors = []
    Object.keys(requiredFields).forEach(item => {
        if (!requiredFields[item]) {
            verificationErrors.push(`required field ${item} is missing`)
        }
    })
    if (verificationErrors.length) {
        throw new BadRequestError(verificationErrors.join(", "))
    }
    const newReviewBody = { ...requiredFields, order, itemRating, title, comment, sellerRating, session: req.user.sessionID }
    //Save images if any
    if (pictures) {
        const picturesArray = (pictures instanceof Array) ? pictures : [pictures]
        const docs = picturesArray.map(doc => {
            const imagePath = ["uploads", "reviews", product, person].join("-")
            var name = [imagePath, crypto.randomBytes(12).toString("hex") + path.extname(doc.name)].join("-")
            return { name, data: doc.data }
        })
        let publicUrl = await uploadFileToS3(docs)
        if (publicUrl.length) {
            newReviewBody.pictures = { ...publicUrl[0] }
        }
    }
    //All requiredFields are not empty.
    const newReview = await new Review(newReviewBody).save()

    res.status(StatusCodes.CREATED).json({ message: "Created review successfully", success: true, result: newReview })
}

const updateReview = async (req, res) => {
    const { reviewID } = req.body
    const { comment, title, itemRating, sellerRating } = req.body
    if (!reviewID) {
        throw new BadRequestError("required parameter reviewID is missing")
    }
    const review = await Review.findOne({ _id: reviewID, deleted: false })
    if (!review) {
        throw new NotFoundError("review does not exist")
    }
    const fieldsUpdate = { comment, title, itemRating, sellerRating }

    Object.keys(fieldsUpdate).forEach(item => {
        if (fieldsUpdate[item]) {
            //Update the review
            review[item] = fieldsUpdate[item]
        }
    })
    await review.save()
    res.status(StatusCodes.OK).json({ message: "review updated successfully", result: review, success: true })

}
const deleteReview = async (req, res) => {
    const { reviewID } = req.body
    if (!reviewID) {
        throw new BadRequestError("missing required field: reviewID")
    }
    const review = await Review.findOneAndUpdate({ _id: reviewID, deleted: false }, { deleted: false })
    if (!review) {
        throw new NotFoundError("review is not found")
    }
    return res.status(StatusCodes.OK).json({ message: "delete review successful", result: null, success: true })
}

const getReviews = async (req, res) => {
    var { deleted } = req.query
    const { userID: person } = req.params

    if (!SUPER_ROLES.includes(req.user.role)) {
        //Ensure only Staff and Admin can access archived reviews.
        deleted = false
    }
    const reviews = await Review.find({ person, deleted })
    res.status(StatusCodes.OK).json({ result: reviews, message: "Successfully returned reviews", success: true })

}
const getReview = async (req, res) => {
    const { reviewID } = req.params
    var { deleted } = req.query
    if (!SUPER_ROLES.includes(req.user.role)) {
        //Ensure only Staff and Admin can access archived reviews.
        deleted = false
    }
    if (!reviewID) {
        throw new BadRequestError("missing required fields `reviewID` ")
    }
    const review = await Review.findOne({ _id: reviewID, deleted })
    if (!review) {
        throw new NotFoundError("review not found")
    }
    res.status(StatusCodes.OK).json({ message: "fetched a review", result: review, success: true })
>>>>>>> review

}



module.exports = { createAReview, updateReview, deleteReview, getReview, getReviews }