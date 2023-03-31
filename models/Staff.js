const mongoose = require("mongoose")

const StaffBase = require("./StaffBase")
const { ticketSchema } = require("./Ticket")

const StaffSchema = new mongoose.Schema({

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
