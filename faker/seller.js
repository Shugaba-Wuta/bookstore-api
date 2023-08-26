const { Seller } = require("../models")
const { faker } = require("@faker-js/faker")


const createSeller = async () => {
    const firstName = faker.name.firstName()
    const lastName = faker.name.lastName()
    const _ = [faker.name.firstName(), null, faker.name.lastName(), null]
    const middleName = _[(Math.floor(Math.random() * _.length))]
    return new Seller({

        firstName,
        middleName,
        lastName,

        email: faker.internet.email(firstName, lastName).toLowerCase(),
        password: "test12345",
        role: "seller",
        phoneNumber: "+23480" + String(faker.datatype.number({ min: 9999999, max: 99999999 })),
        gender: ["M", "F"][Math.floor(Math.random() * 2)],
        NIN: faker.datatype.number({ min: 9999999999, max: 99999999999 }),
    })
}



const addSellersToDB = (async (number) => {

    for (let i = 0; i <= number; i++) {
        let user = await createSeller()
        await user.save()
    }
    console.log(`Added ${number} to DB`)

})(25)

module.exports = addSellersToDB
