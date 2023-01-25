const axios = require("axios")
const { CustomAPIError } = require("../errors")
const hostname = 'https://api.paystack.co'
const { DEFAULT_COMMISSION } = require("../config/app-data")



const verifyBankAccount = async ({ account_number, bank_code }) => {
    const options = {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
        method: "get",
        baseURL: hostname,
        url: `/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`
    }

    try {
        const r = await axios(options)
        return r.data

    } catch (error) {
        if (axios.isAxiosError(error)) {
            return error.response.data
        } else {
            throw new CustomAPIError("Unexpected error occurred when verifying account")
        }
    }
}

const isBankAccountValid = async ({ account_number, bank_code, firstName, lastName, name = null }) => {
    const verifyInfo = await verifyBankAccount({ account_number, bank_code })
    if (verifyInfo.status) {
        //Basic name check
        const accountName = String(verifyInfo.data.account_name).toLowerCase()
        let includesFirstName = accountName.includes(firstName.toLowerCase())
        let includesLastName = accountName.replace(firstName, "").includes(lastName.toLowerCase())
        if (includesFirstName && includesLastName)
            return true
        else if (name && accountName.includes(name.toLowerCase())) {
            return true
        }
    }
    return false

}


const createASubaccount = async ({ bank_code, business_name, account_number }) => {
    const data = {
        business_name,
        bank_code,
        account_number,
        percentage_charge: DEFAULT_COMMISSION
    }

    const options = {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
        method: "POST",
        baseURL: hostname,
        url: `/subaccount`,
        data: JSON.stringify(data)
    }

    try {
        const r = await axios(options)
        return r.data
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return error.response.data
        } else {
            throw new CustomAPIError("Unexpected error occurred when creating subaccount")
        }
    }
}


module.exports = { verifyBankAccount, isBankAccountValid, createASubaccount }