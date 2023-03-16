const hbs = require('nodemailer-express-handlebars')
const nodemailer = require('nodemailer')
const path = require('path')


const transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: process.env.TEST_EMAIL_USER,
        pass: process.env.TEST_EMAIL_PASS
    }
})

//configure transport to use handlebars
const handlebarOptions = {
    viewEngine: {
        partialsDir: path.resolve('./mailing/views/partials/'),
        defaultLayout: "./mailing/views/layout.handlebars",
    },
    viewPath: path.resolve('./mailing/views/layouts/'),
}

transport.use("compile", hbs(handlebarOptions))


const sendEmail = async ({ recipients, subject, template, context }) => {
    recipients = recipients.join(", ")
    var mailOptions = {
        from: '"Wuta" <wuta@gmail.com>',
        to: recipients,
        subject,
        template,
        context
    }
    await transport.sendMail(mailOptions)
}

module.exports = { sendEmail }