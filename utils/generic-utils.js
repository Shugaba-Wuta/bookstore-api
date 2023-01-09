const { PutObjectCommand } = require("@aws-sdk/client-s3")
const { s3Client } = require("./s3-setup")
const { StatusCodes } = require("http-status-codes")

const uploadFileToS3 = async (files, bucket = process.env.AWS_GEN_S3_BUCKET) => {

    const urls = []
    var publicUrl

    for await (const file of files) {
        try {
            const response = await s3Client.send(new PutObjectCommand({
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
const limitHandler = (req, res, next) => {
    return res.status(StatusCodes.REQUEST_TOO_LONG).json({
        success: false,
        error: true,
        message: `File limit exceeded. Ensure all file(s) are less than ${process.env.MAX_FILE_SIZE_IN_KB} kB`,
    })
}



module.exports = { uploadFileToS3, limitHandler }