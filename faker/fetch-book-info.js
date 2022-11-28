// const books = require("./books-data.json")
const axios = require("axios")
const { randomBytes } = require("crypto")
const util = require("util")
const fs = require("fs")
const { response } = require("express")

const URL = "https://www.googleapis.com/books/v1/volumes?q=isbn:"

const writer = function (book) {
    if (!book) {
        return null
    }
    fs.open("modified-books-data.json", "r+", function (err, fd) {
        if (err) {
            throw err
        }
        fs.fstat(fd, function (err, stats) {
            var pos
            if (err) throw err
            if (stats.size > 2) {
                json_load = new Buffer("," + book, "utf-8")
                pos = parseInt(stats.size)
            } else {
                json_load = new Buffer(book, "utf-8")
                pos = 0
            }

            fs.write(fd, json_load, 0, json_load.length, pos, function (err, written, buffer) {
                if (err) throw err
                fs.close(fd, function () { })
            })
        })
    })
}

const getBookInfoAndSave = async function (book, index) {
    try {
        //retreive book info
        const config = { headers: { keepAlive: true } }
        var response = (await axios.get(URL + book.ISBN13, config))
        if (!response.data.items) {
            console.log(index, " Empty items response")
            return null
            // console.log(response.data)
            // throw new Error("response.data is empty")
        }
        response = response.data.items[0]
        book.publisher = response.volumeInfo.publisher
        book.description = response.volumeInfo.description
        response.volumeInfo.industryIdentifiers.forEach((identifier) => {
            if (identifier.type === "ISBN_10") {
                book.ISBN10 = identifier.identifier
            } else if (identifier.type === "ISSN") {
                book.ISSN = identifier.identifier
            }
        })
        book.publicationDate = response.volumeInfo.publishedDate
        book.numberOfPages = response.volumeInfo.pageCount
        book.language = response.volumeInfo.language
        book.tags = response.volumeInfo.categories
        book.subtitle = response.volumeInfo.subtitle
        //write into file 
        writer(JSON.stringify(book))
        return book

    } catch (err) {
        console.log(index, " API fetch error")
        return null
    }

}
fs.readFile('books-data.json', { encoding: "utf-8" }, async (err, fd) => {
    if (err) {
        throw err
    }
    JSON.parse(fd).forEach((book, index) => {
        setTimeout(async () => {
            if (index < 5000) {
                const x = await getBookInfoAndSave(book, index)
                if (!x) {
                    // console.log(index, " fetch failed")
                }
            }
        }, Math.random() * 150000 + Math.random() * 150000 + Math.random() * 150000 + Math.ceil(index))
    })
})


