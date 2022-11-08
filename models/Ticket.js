const mongoose = require("mongoose")
const ticketStatus = ["pending", "completed", "processing"]
const ticketPriority = ["low", "moderate", "high", "high-extreme"]
const ticketType = ["other", "report", "abuse",]


const ticketSchema = new mongoose.Schema({
    label: {
        type: String,
        trim: true,
        required: [true, "Please provide a label for ticket"]
    },
    description: {
        type: String,
        trim: true,
    },
    document: {
        type: [{
            path: String,
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }],

    },
    type: {
        type: String,
        enum: {
            values: ticketType,
            message: `Please provide a ticket type of any of the following values: ${ticketType}`
        },
        default: "other"
    },
    priority: {
        type: String,
        enum: {
            values: ticketPriority,
            message: `Please provide ticket priority from any of the following values: ${ticketPriority}`
        },
        default: "moderate"
    },
    raisedBy: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: [true, "Please provide customer/user identifier"]
    },
    product: {
        type: mongoose.Types.ObjectId,
        ref: "Product"
    },
    status: {
        type: String,
        enum: {
            values: ticketStatus,
            message: `Please provide ticket status from any of the following values: ${ticketStatus}`
        },
        default: "pending",
    },
    escalated: {
        type: Boolean,
        default: false
    },
    allAssignee: {
        type: [mongoose.Types.ObjectId],
        ref: "StaffBase",
    },
    handler: {
        type: mongoose.Types.ObjectId,
        ref: "Staff"
    },
    resolution: {
        type: String,
        minLength: 10,
        trim: true
    },
    resolvedBy: {
        type: mongoose.Types.ObjectId,
        ref: "Staff"
    },
    resolvedAt: {
        type: Date,
        default: Date.now()
    },
    affectedEndUser: {
        type: [mongoose.Types.ObjectId],
        ref: "User"
    }

}, { timestamps: true })


const Ticket = mongoose.model("Ticket", ticketSchema)
module.exports = { ticketSchema, Ticket }
