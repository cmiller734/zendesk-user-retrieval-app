const Excel = require('exceljs')
const fs = require('fs')
const chalk = require('chalk')
const date = new Date;

//FOR TESTING
const userJsonArr = [{
    "email": "example@example.com",
    "name": "exampleName",
    "phone": "555-555-5555",
    "organization_id": 123456789
}]

//Create worksheet
const createAndPopulateWorkbook = (jsonArr) => {
    let workbook = new Excel.Workbook()
    let worksheet = workbook.addWorksheet('Zendesk Users', {views:[{state: 'frozen', xSplit: 1}]}) //freeze top row
    worksheet.columns = [
        { header: 'Name', key: 'name' },
        { header: 'E-Mail', key: 'email' },
        { header: 'Company', key: 'company' },
        { header: 'Phone', key: 'phone' },
    ]
    worksheet.getRow(1).font = { bold: true }
    worksheet.columns.forEach(column => {
        column.width = 40
    })
    jsonArr.forEach(jsonObj => {
        // if (jsonObj.phone === null) {
        //     jsonObj.phone = '';
        // }
        worksheet.addRow(jsonObj);
    });
    return workbook
}

//write JSON data to file asynchronously
const writeWorkbookToFile = async (workbook) => {
    console.log(chalk.blue(`removing xlsx files...`))
    fs.promises.rm('./xlsx-files', { recursive: true })
    .then(async () => {
        console.log(chalk.blue(`creating new xlsx-files directory...`))
        await fs.promises.mkdir('./xlsx-files');
    })
    .then(async () => {
        console.log(chalk.blue(`writing new xlsx file...`));
        await workbook.xlsx.writeFile(`./xlsx-files/zendesk-users-last-12-months-${date.getMilliseconds()}.xlsx`);
    })
    .catch(err => console.log(chalk.red(`error writing data to Excel file: ` + err)))
    .then(() => console.log(chalk.green('Data has been successfully written to file!')));
}


//FOR TESTING
// const userWorkbook = createAndPopulateWorkbook(userJsonArr)
// await writeWorkbookToFile(userWorkbook)

exports.createAndPopulateWorkbook = createAndPopulateWorkbook;
exports.writeWorkbookToFile = writeWorkbookToFile;