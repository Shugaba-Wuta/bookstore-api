const mongoose = require("mongoose")
const { staffIdGenerator } = require("../utils/model-utils")
const validator = require("validator")


const ROLES = ["admin", "staff", "manager"]
const GENDER = ["M", "F"]
const employmentType = ["contract", "full-time", "part-time", "consultant"]

const StaffBaseSchema = mongoose.Schema({
    name: {
        type: Map,
        of: new mongoose.Schema({
            first: {
                type: String, minLength: 4, maxLength: 64,
                required: [true, "Please provide a first name"]
            },
            middle: {
                type: String, minLength: 2, maxLength: 64,
            },
            last: {
                type: String, minLength: 2, maxLength: 64,
                required: [true, "Please provide a last name"]
            }
        })
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'Please provide email'],
        validate: {
            validator: validator.isEmail,
            message: 'Please provide valid email',
        }
    },
    password: {
        type: String,
        required: [true, 'Please provide password'],
        minlength: 8,
    },
    phoneNumber: {
        type: String,
    },
    gender: {
        type: String,
        enum: GENDER
    },
    role: {
        type: String,
        enum: {
            values: ROLES,
            message: `Role must be either of the following: ${ROLES}`
        },
        default: "staff"
    },
    staffId: {
        type: String,
        unique: true,
    },
    employmentType: {
        type: String,
        enum: {
            values: employmentType,
            message: `Please provide employment type from any of these values: ${employmentType}`
        },
        required: [true, "Please provide employment type"]
    },
}, {
    timestamps: true,
    discriminatorKey: "kind"
})

StaffBaseSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
})

StaffBaseSchema.methods.comparePassword = async function (candidatePassword) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
};

StaffBaseSchema.methods.getFullName = async function () {
    return ([this.name.first, this.name.middle, this.name.last]).filter((item) => { return item && item.length > 0 }).join(" ")
}

StaffBaseSchema.pre("save", async function () {
    this.staffId = await staffIdGenerator()
})


module.exports = mongoose.model("StaffBase", StaffBaseSchema)
