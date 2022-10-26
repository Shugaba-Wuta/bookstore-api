const mongoose = require("mongoose")

const StaffBase = require("./StaffBase")
const { ticketSchema } = require("./Ticket")
const defaultStaffPermission = []

const StaffSchema = new mongoose.Schema({
    permissions: {
        type: [String],
        default: defaultStaffPermission
    },
    tickets: {
        pending: [ticketSchema],
        completed: [ticketSchema],
        escalated: [ticketSchema]
    },
    department: {
        type: String,
    }


})



module.exports = StaffBase.discriminator("Staff", StaffSchema, { discriminatorKey: "kind" })
