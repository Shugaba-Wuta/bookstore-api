const swaggerJsDoc = require("swagger-jsdoc")
const path = require("path")

const swaggerOptions = {
    definition: {
        failOnErrors: true,
        openapi: '3.0.3',
        info: {
            title: 'Catalogue Smart',
            version: '1.0.0',
            description: "An online store for buying books in Nigeria"
        },
    },
    apis: [path.join(__dirname, '../docs/*.yml')]
};
module.exports = swaggerJsDoc(swaggerOptions)