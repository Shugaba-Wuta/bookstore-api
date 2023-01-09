const { S3Client } = require("@aws-sdk/client-s3");


const REGION = process.env.AWS_REGION
const ACCESS_KEY = process.env.AWS_S3_BUCKET_ACCESS_KEY
const SECRET_KEY = process.env.AWS_S3_SECRET_KEY



const s3Client = new S3Client({
    region: REGION, credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY
    }
});


module.exports = { s3Client };