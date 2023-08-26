const { S3Client } = require("@aws-sdk/client-s3");
const { getDefaultRoleAssumerWithWebIdentity } = require("@aws-sdk/client-sts");
const { defaultProvider } = require("@aws-sdk/credential-provider-node");


// const REGION = process.env.AWS_REGION
// const ACCESS_KEY = process.env.AWS_S3_BUCKET_ACCESS_KEY
// const SECRET_KEY = process.env.AWS_S3_SECRET_KEY
// const s3Client = new S3Client({
//     region: REGION, credentials: {
//         accessKeyId: ACCESS_KEY,
//         secretAccessKey: SECRET_KEY
//     }
// });


const provider = defaultProvider({
    roleAssumerWithWebIdentity: getDefaultRoleAssumerWithWebIdentity(),
});

const s3Client = new S3Client({ credentialDefaultProvider: provider });


module.exports = { s3Client };