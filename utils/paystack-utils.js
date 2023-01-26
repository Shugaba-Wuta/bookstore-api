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
const isSameName = (accountName, providedName) => {
    const unitNames = providedName.split(" ")
    const accountNameLowerCase = String(accountName.toLowerCase())
    const cond = unitNames.every((name) => {
        let toMatch = name.toLowerCase().replace(/\s/, "")
        console.log(toMatch, accountNameLowerCase.match(toMatch), accountNameLowerCase)
        if (!accountNameLowerCase.match(toMatch)) {
            console.log("isSameName is false")
            return false
        }
        accountNameLowerCase.replace(name, "")
        return true
    })
    return cond

}

const isBankAccountValid = async ({ account_number, bank_code, name }) => {
    const verifyInfo = await verifyBankAccount({ account_number, bank_code })
    if (verifyInfo.status) {
        //Basic name check
        const accountName = String(verifyInfo.data.account_name)
        const requestName = name
        if (isSameName(accountName, requestName)) {
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