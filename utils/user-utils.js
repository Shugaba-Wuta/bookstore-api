const fs = require("fs")


const writeRequestFiles = async (fileObject, fullPath, options = { multipleFiles: true }) => {
    //Accepts file(s) as object/ array of objects and stores them on localmachine
    if (fileObject instanceof Array) {
        fileObject.forEach(async (file) => {
            console.log(file.path)
            await file.mv(file.path)
        })
    } else {
        await fileObject.mv(fileObject.path)
    }

}


module.exports = { writeRequestFiles }