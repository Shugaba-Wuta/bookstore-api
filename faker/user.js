const { User } = require("../models")
const { Document } = require("../models")
const { faker } = require("@faker-js/faker")


const createDocument = async (name) => {
    docs = new Document({
        path: faker.system.filePath(),
        name: name
    })
    return await docs.save()
}

const createUser = async () => {
    const firstName = faker.name.firstName()
    const lastName = faker.name.lastName()
    const _ = [faker.name.firstName(), null, faker.name.lastName(), null]
    const middleName = _[(Math.floor(Math.random() * _.length))]
    return new User({
        name: {
            first: firstName,
            middle: middleName,
            last: lastName,
        },
        email: faker.internet.email(middleName || firstName, lastName),
        password: "test12345",
        role: "user",

        gender: ["M", "F", null][Math.floor(Math.random() * 3)],
        avatar: [null, await createDocument("avatar")][Math.floor(Math.random() * 2)],
    })
}



const addUsersToDB = async (number = 1000) => {
    try {
        let user
        for (let i = 0; i <= number; i++) {
            user = await createUser()
            await user.save()
        }
        console.log(`Added ${number} to DB`)
    } catch (err) {
        throw err
    }

}
addUsersToDB()
console.log("Reached the end")
module.exports = addUsersToDB
