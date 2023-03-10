const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3")
const { s3Client } = require("./s3-setup")
const { StatusCodes } = require("http-status-codes")
const s3ParseUrl = require('s3-url-parser')

const { Book } = require("../models")
const { CustomAPIError } = require("../errors")

const uploadFileToS3 = async (files, bucket = process.env.AWS_GEN_S3_BUCKET) => {

    const urls = []
    var publicUrl

    for await (const file of files) {
        try {
            await s3Client.send(new PutObjectCommand({
                Bucket: bucket,
                Key: file.name,
                Body: file.data
            }))
            publicUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.name}`
            urls.push({ url: publicUrl, uploadedAt: Date.now() })
        } catch (err) {
            //log
            console.log(err)

        }
    }
    return urls

}


const deleteFilesFromS3 = async (arrayURL) => {
    for await (const url of arrayURL) {
        try {
            const { bucket = process.env.AWS_GEN_S3_BUCKET, key } = s3ParseUrl(url);
            await s3Client.send(new DeleteObjectCommand({
                Bucket: bucket,
                Key: key,
            }))

        } catch (err) {
            //log
            console.log(err)
        }

    }
}
const limitHandler = (req, res) => {
    return res.status(StatusCodes.REQUEST_TOO_LONG).json({
        success: false,
        error: true,
        message: `File limit exceeded. Ensure all file(s) are less than ${process.env.MAX_FILE_SIZE_IN_KB} kB`,
    })
}


const addOrDecreaseProductQuantity = async (productQuantity = [], operation = "increment") => {
    const INC = "increment"
    const DEC = "decrement"
    if (![INC, DEC].includes(operation)) {
        throw new CustomAPIError("Invalid 'operation' defined for addOrDecreaseProductQuantity function")
    }
    let multiplier = 1
    if (operation === DEC) {
        multiplier = -1
    }
    const queryBody = productQuantity.map(item => {
        return {
            updateOne: {
                filter: { _id: item.productID },
                update: { $inc: { quantity: multiplier * item.quantity } }
            }
        }
    })
    await Book.bulkWrite(queryBody)



}




module.exports = { uploadFileToS3, limitHandler, deleteFilesFromS3, addOrDecreaseProductQuantity }