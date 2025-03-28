// usage: node activeCompaniesUserList ${zendeskApiUsername} ${zendeskApiPassword} ${numMonthsToPull} ${subdomainName}
// this script retrieves a list of active users in Zendesk who have interacted (via tickets) within a specified number of months, 
// and it outputs the data (including company names) to an Excel file
// ${numMonthsToPull} = however many months you want to pull data for - set to 12 to get a years' worth of data
// e.g. node activeCompaniesUserList john.doe@company.com aFakePassword123 12 xlsx

//-----PACKAGES, GLOBAL VAR, ETC-----
const requestHandler = require(`../zendesk-get-tickets-by-org/helper-functions/handle-request`);
const dateHandler = require(`./helper-functions/get-past-date`);
const jsonToExcelConverter = require(`./helper-functions/json-to-excel-file.js`);
const chalk = require('chalk');
var numMonthsToPull = process.argv[4]; //for process.argv[2] and process.argv[3], see helper function handle-request.js
const subdomainName = process.argv[5]
var dateXMonthsAgoAsString = ''
try {
    dateXMonthsAgoAsString = dateHandler.getDateXMonthsAgo(numMonthsToPull).toISOString();
} catch (err) {
    console.log(chalk.red('error getting # months to pull - have you entered a integer on the cmd line?\n' + err))
}

var pageNumber = 1;
var maxPgNum = 10; //see https://developer.zendesk.com/rest_api/docs/support/search "results limit" section, 10pg max
var allOrgIdsArr = []
var allCustomerInfoArr = []


//-----FUNCTION DECLARATIONS-----
const startUserRetrievalProcess = async () => {
    console.log(chalk.green('Gathering User E-mail List from API...'))
    return await new Promise((r, j) => getAllOrgIds(r, j))
};
// org id functions
const getAllOrgIds = async (resolve) => { //resolve is reserved keyword here
    try {
        let orgIdsByPage = await getOrgIdsByPage(pageNumber)
        if (orgIdsByPage) {
            pageNumber++;
            allOrgIdsArr.push(orgIdsByPage);
            getAllOrgIds(resolve); //Do it again
        } else {
            resolve(allOrgIdsArr)
        }
    } catch (err) {
        console.trace(chalk.red('Error with function getAllOrgIds ' + err))
        return
    }
}
const getOrgIdsByPage = async (pgNum = 1) => {
    console.log(chalk.blue(`Getting organization IDs for page ${pgNum}...`))
    try {
        if (pgNum <= maxPgNum) {
            var ticketsApiCall = `https://${subdomainName}.zendesk.com/api/v2/search.json?page=${pgNum}&query=type:ticket+created>${dateXMonthsAgoAsString}&sort_by=created_at&sort_order=asc`
            var apiRequest = await requestHandler.handleRequest("GET", ticketsApiCall)
            var pageOrgIds = apiRequest.results
                .map(result => result.organization_id)
                .filter(result => typeof (result) === 'number')
            return pageOrgIds
        } else {
            console.log(chalk.green('Page retrieval is complete!'))
        }
    } catch (err) {
        console.trace(chalk.red(`error with function getOrgIdsByPage: ${err}`))
        return
    }
}

//customer info (besides name) functions
const getAllCustomerInfo = async (uniqueOrgIds) => {
    var flatuniqueOrgIds = [... new Set(uniqueOrgIds.flat())]
    console.log(chalk.green('unique org ID set generated!'))
    console.log(chalk.blue('getting customer information by org ID...'))
    for (var i in flatuniqueOrgIds) {
        try {
            const customerInfoByOrgId = await getCustomerInfoByOrgId(flatuniqueOrgIds[i])
            const neededInfoArr = customerInfoByOrgId.users
            .map(user => {
                return (({ email, name, phone, organization_id }) => ({ email, name, phone, organization_id }))(user)
            })

            allCustomerInfoArr.push(neededInfoArr)
        } catch (err) {
            console.trace(chalk.red('Error with function getAllCustomerInfo! ' + err))
            return
        }
    }
    console.log(chalk.green('unique customer Email list generated for all orgs!'))
    return allCustomerInfoArr.flat()
}
const getCustomerInfoByOrgId = async (uniqueOrgId) => {
    try {
        // console.log(chalk.blue('Getting customer info for organization ' + uniqueOrgId))
        var apiString = `https://${subdomainName}.zendesk.com/api/v2/organizations/${uniqueOrgId}/users.json?role=end-user&active=true`
        return await requestHandler.handleRequest("GET", apiString)
    } catch (err) {
        console.trace(chalk.red(`Error getting customer information for organization ID ${uniqueOrgId}: ${err}`))
    }
}

// customer name functions
const getCompanyNamesById = async (idList) => {
    try {
        const companyIdAndNameArr = [];
        for (var i in idList) {
            const companyNameObj = await getCompanyName(idList[i])
            const companyName = companyNameObj.organization.name
            companyIdAndNameArr.push({
                "organization_id": idList[i],
                "companyName": companyName
            })
        }
        return companyIdAndNameArr
    } catch (err) {
        console.trace(chalk.red('error getting company names by ID ' + err))
        return
    }
}
const getCompanyName = async (companyOrgId) => {
    try {
        var apiString = `https://${subdomainName}.zendesk.com/api/v2/organizations/${companyOrgId}`
        return await requestHandler.handleRequest("GET", apiString)
    } catch (err) {
        console.trace(chalk.red(`Error getting company name: ${err}`))
        return
    }
}
const assignCompanyNamesToCustomers = async (customerListWoCompany) => {
    const uniqueOrgIdList = [...new Set(customerListWoCompany.map(item => item.organization_id))];
    var nameObjArr = await getCompanyNamesById(uniqueOrgIdList)
    const customerListWCompany = customerListWoCompany.map(customer => {
        nameObjArr.forEach(nameObj => {
            if (customer.organization_id == nameObj.organization_id) {
                customer.company = nameObj.companyName
            }

        })
        return customer
    })
    return customerListWCompany
}

//-----Main Process-----
startUserRetrievalProcess() //GET ORGANIZATION IDS
    .then(async orgIdArr => {
        console.log(chalk.blue('Getting customer info...'))
        return await getAllCustomerInfo(orgIdArr) //GET CUSTOMER INFO FROM ORG IDS
    })
    .catch(err =>  console.trace(chalk.red(`Error getting customer info: ${err}`)))
    .then(async customerListNoCompanyName => {
        console.log(chalk.blue(`Assigning company names to customers...`))
        return await assignCompanyNamesToCustomers(customerListNoCompanyName) //ASSIGN CO NAME FROM CO ID
    })
    .catch(err =>  console.trace(chalk.red(`error correlating company name with organization ID: ${err}`)))
    .then(async cleanedUpCustomerList => {
        console.log(chalk.blue("Creating excel file from customer data..."))
        const worksheet = jsonToExcelConverter.createAndPopulateWorkbook(cleanedUpCustomerList) //POPULATE FILE W DATA

        console.log(chalk.blue("Writing customer data to created Excel file..."))
        await jsonToExcelConverter.writeWorkbookToFile(worksheet) //WRITE DATA TO EXCEL FILE
    })
    .catch(err =>  console.trace(chalk.red(`Error converting customer list to excel: ${err}`)))
    .then(async () => console.log(chalk.green(`Customer E-mails from last ${numMonthsToPull} months successfully written to excel`)))
    .catch(async () =>  console.trace(chalk.red(`Script has completed with errors. See log for details.`)))