const hbs = require('nodemailer-express-handlebars')
const nodemailer = require('nodemailer')
const path = require('path')
const aws = require("@aws-sdk/client-ses");
const { defaultProvider } = require("@aws-sdk/credential-provider-node");
const { CustomAPIError } = require('../errors');
const { PRODUCTION_ENV } = require('../config/app-data');



/*
 * Sends an email using AWS SMTP if NODE_ENV is in production. Otherwise, it sends email using Mailtrap  test SMTP
 */



var transporter
if (process.env.NODE_ENV === PRODUCTION_ENV) {
    const AWS_REGION = process.env?.AWS_REGION
    if (!AWS_REGION) {
        throw new CustomAPIError("AWS_REGION not configured")
    }
    const ses = new aws.SES({
        apiVersion: "2010-12-01",
        region: AWS_REGION,
        defaultProvider,
    });
    transporter = nodemailer.createTransport({
        SES: { ses, aws }
    })

} else {
    if (!process.env.TEST_EMAIL_PASS || !process.env.TEST_EMAIL_USER) {
        throw new CustomAPIError("email TEST auth improperly configured")
    }
    transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: process.env.TEST_EMAIL_USER,
            pass: process.env.TEST_EMAIL_PASS
        }
    })


}

//configure transport to use handlebars
const handlebarOptions = {
    viewEngine: {
        partialsDir: path.resolve('./mailing/views/partials/'),
        defaultLayout: "./mailing/views/layout.handlebars",
    },
    viewPath: path.resolve('./mailing/views/layouts/'),
}

transporter.use("compile", hbs(handlebarOptions))


const sendEmail = async ({ recipients, subject, template, context, from = '"noreply" <noreply@books9ja.com>' }) => {
    recipients = recipients.join(", ")
    var mailOptions = {
        from: from,
        to: recipients,
        subject,
        template,
        context
    }
    await transporter.sendMail(mailOptions)
}

module.exports = { sendEmail }