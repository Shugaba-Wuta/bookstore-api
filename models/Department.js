const mongoose = require("mongoose")

const productDepartmentSchema = new mongoose.Schema({
    dept: {
        type: [String],
    }
}, {
    timestamps: true
})

productDepartmentSchema.methods.numberOfDepartment(async function () {
    const allDepartment = await this.find({}).lean()
    return allDepartment.length
})



module.exports = mongoose.model("Department", productDepartmentSchema)