const fs = require('fs');

const writeApiCallToFile = (apiResponseAsJson) => {
    fs.appendFileSync('test.json',JSON.stringify(apiResponseAsJson, null, "\t"))
}

const clearFile = () => {
    fs.writeFileSync('test.json','');
}

exports.writeApiCallToFile = writeApiCallToFile
exports.clearFile = clearFile