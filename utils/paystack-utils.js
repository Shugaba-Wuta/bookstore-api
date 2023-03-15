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
        if (!accountNameLowerCase.match(toMatch)) {
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
const paystackInitiateDynamicMultiSplit = async (email, orderTotal, metadata, reference) => {
    const data = {
        // splitPayDetails, productQuantity, cartID: this.cartID, orderID: this._id
        email,
        amount: orderTotal,
        split: {
            type: "flat",
            subaccounts: metadata.splitPayDetails,
            bearer_type: "account",
        }, reference, metadata: JSON.stringify(metadata)
    }

    const options = {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
        method: "POST",
        baseURL: hostname,
        url: `/transaction/initialize`,
        data: JSON.stringify(data)
    }

    try {
        const r = await axios(options)
        return r.data

    } catch (error) {
        if (axios.isAxiosError(error)) {
            return error.response.data || error.data
        } else {
            throw new CustomAPIError("Unexpected error occurred when verifying account")
        }
    }
}

const getAccessUrl = async (email, orderTotal, metadata, reference) => {
    //Initiate paystack transaction (dynamic split)
    // email, orderTotal, splitPayDetails, reference, metadata
    const response = await paystackInitiateDynamicMultiSplit(email, orderTotal, metadata, reference)
    if (response && response.status) {
        const { authorization_url: authorizationUrl, access_code: accessCode, reference } = response.data
        return { authorizationUrl, reference, accessCode }
    }

}
const verifyTransactionStatus = async (transactionRef) => {
    const options = {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
        method: "get",
        baseURL: hostname,
        url: `/transaction/verify/${transactionRef}`
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
const getPaymentDetails = async (transactionRef) => {
    const response = await verifyTransactionStatus(transactionRef)
    return response
}

const isPaymentSuccessful = async (transactionRef) => {
    //
    const response = await verifyTransactionStatus(transactionRef)
    console.log(response.status)
    if (response.status && response.data.status == "success") {
        return true
    }
    return false
}

module.exports = { verifyBankAccount, isBankAccountValid, createASubaccount, paystackInitiateDynamicMultiSplit, verifyTransactionStatus, isPaymentSuccessful, getAccessUrl, getPaymentDetails }