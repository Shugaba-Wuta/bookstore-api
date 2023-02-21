const { User } = require("../models")
const { faker } = require("@faker-js/faker")


const createUser = async () => {
    const firstName = faker.name.firstName()
    const lastName = faker.name.lastName()
    const _ = [faker.name.firstName(), null, faker.name.lastName(), null]
    const middleName = _[(Math.floor(Math.random() * _.length))]
    return new User({
        firstName,
        middleName,
        lastName,
        email: faker.internet.email(firstName, lastName).toLowerCase(),
        password: "test12345",
        role: "user",
        gender: ["M", "F", null][Math.floor(Math.random() * 3)],
    })
}

const addUsersToDB = (async (number) => {
    let user
    for (let i = 0; i <= number; i++) {
        user = await createUser()
        await user.save()
    }
    console.log(`Added ${number} to DB`)
})(5)
module.exports = addUsersToDB
