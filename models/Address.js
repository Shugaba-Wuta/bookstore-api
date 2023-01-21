const mongoose = require("mongoose")
const mongooseHidden = require("mongoose-hidden")({ defaultHidden: { deleted: true, deletedOn: true } })


const statesAndLG = require("../config/states-and-lgs.json")
const STATES = Object.keys(statesAndLG)
const LG = []
statesAndLG.array.forEach(state => {
    LG.push(...statesAndLG[state])

});

const addressSchema = new mongoose.Schema({
    unit: {
        type: String,
        trim: true
    },
    street: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        trim: true,
        required: [true, "city is a required field"]
    },
    LGA: {
        type: String,
        trim: true,
        require: [true, "LGA is a required field for Address"],
        enum: {
            values: LG,
            message: "Invalid option for Local Government Area"
        }
    },
    state: {
        type: String,
        trim: [true, "state is a required field for Address"],
        enum: {
            values: STATES,
            message: "Invalid option for State"
        }
    },
    country: {
        type: String,
        trim: true,
        default: "Nigeria"
    },
    zipCode: {
        type: String,
        trim: true,
        required: [true, "zipCode is a required field"]
    },
    person: {
        type: String,
        refPath: "personSchemaType",
    },
    personSchemaType: {
        type: mongoose.Types.ObjectId,
        required: [true, "personSchema is missing"],
        enum: {
            values: ["User", "Seller"],
            message: "personSchema should be any of the following values ['User', 'Seller']"
        },
    },
    default: {
        type: Boolean,
        default: true,
    },
    deleted: {
        type: Boolean,
        default: false,
    },
    deletedOn: {
        type: Date,
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})


addressSchema.pre("save", async function ensureOnlyOneDefaultAddress(next) {
    const samePerson = await this.model("Address").find({ person: this.person, personSchemaType: this.personSchemaType }).lean()
    let numberOfDefaults = 0
    samePerson.forEach(address => {
        if (numberOfDefaults > 0 && address.default) {
            address.default = false
        }
    })
    next()
})
addressSchema.plugin(mongooseHidden)


module.exports = mongoose.model("Address", addressSchema)