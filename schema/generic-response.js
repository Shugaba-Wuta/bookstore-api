const joi = require("joi")
// const CustomAPIError = require("../errors/custom-api")

const genericResponseSchema = joi.object({
    success: joi.boolean(),//.required(),
    error: joi.boolean().required(),
    message: joi.string(),
    result: joi.array().items(joi.object()),
    resultInfo: joi.object({
        totalResult: joi.number(),
        currentPage: joi.number(),
        resultCount: joi.number(),
        totalPageCount: joi.number()
    })


})


class GenericResponse {
    constructor(message = "fknjsfkn", result = [], resultInfo = { totalResult: 0, currentPage: 0, resultCount: 0, totalPageCount: 0 }, success = true, error = false) {
        this.message = message
        this.result = result
        this.resultInfo = resultInfo
        this.success = success
        this.error = error
    }
    generateReponse() {
        return {
            success: this.success,
            error: this.error,
            message: this.message,
            result: this.result,
            resultInfo: this.resultInfo,

        }
    }
    async isValid() {
        try {
            this.response = this.generateReponse()
            await genericResponseSchema.validateAsync(this.response)
            return true
        } catch (err) {
            console.log(err)
            throw new Error("Could not validate response")
        }
    }

}

module.exports = GenericResponse