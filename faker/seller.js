const { Seller } = require("../models")
const { Document } = require("../models")
const { faker } = require("@faker-js/faker")
const { nigerianCommercialBanks } = require("../app-data")
const banks = nigerianCommercialBanks.map((item) => {
    return item.name
})

const createDocument = async (name) => {
    docs = new Document({
        path: faker.system.filePath(),
        name: name
    })
    return await docs.save()
}

const createSeller = async () => {
    const firstName = faker.name.firstName()
    const lastName = faker.name.lastName()
    const _ = [faker.name.firstName(), null, faker.name.lastName(), null]
    const middleName = _[(Math.floor(Math.random() * _.length))]
    const role = ["seller", "publisher", "seller"][Math.floor(Math.random() * 3)]
    return new Seller({
        name: {
            first: firstName,
            middle: middleName,
            last: lastName,
        },
        email: faker.internet.email(middleName || firstName, lastName),
        password: "test12345",
        role: role,


        phoneNumber: "+23480" + String(faker.datatype.number({ min: 9999999, max: 99999999 })),
        gender: ["M", "F"][Math.floor(Math.random() * 2)],
        documents: {
            picture: await createDocument("verification-picture"),
            govtIssuedID: await createDocument("govt-id"),
            avatar: [null, await createDocument("avatar")][Math.floor(Math.random() * 2)]
        },
        BVN: faker.datatype.number({ min: 9999999999, max: 99999999999 }),
        NIN: faker.datatype.number({ min: 9999999999, max: 99999999999 }),
        account: {
            number: String(faker.datatype.number({ min: 999999999, max: 9999999999 })),
            name: [firstName, lastName, middleName].filter((name) => {
                return name !== null
            }).join(" "),
            bankName: banks[Math.floor(Math.random() * banks.length)]
        },
    })
}



const addSellersToDB = async (number = 1000) => {
    try {
        let user
        for (let i = 0; i <= number; i++) {
            user = await createSeller()
            await user.save()
        }
        console.log(`Added ${number} to DB`)
    } catch (err) {
        throw err
    }

}
addSellersToDB()
module.exports = addSellersToDB
