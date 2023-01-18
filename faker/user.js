const { User } = require("../models")

const { faker } = require("@faker-js/faker")




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
        email: faker.internet.email(firstName, lastName).toLowerCase(),
        password: "test12345",
        role: "user",

        gender: ["M", "F", null][Math.floor(Math.random() * 3)],
        avatar: { path: faker.system.filePath() + "profile-picture.png" },
    })
}



const addUsersToDB = async (number = 10000) => {
    let user
    for (let i = 0; i <= number; i++) {
        user = await createUser()
        await user.save()
    }
    console.log(`Added ${number} to DB`)


}
addUsersToDB()
console.log("Reached the end")
module.exports = addUsersToDB
