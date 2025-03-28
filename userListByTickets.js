// usage: node userListByTickets ${zendeskApiUsername} ${zendeskApiPassword} ${numMonthsToPull}
// this script retrieves a list of active users from a Zendesk account over a specified period (in months) and outputs the data to an Excel file

// e.g. node userListByTickets john.doe@company.com aFakePassword123 12 myZendeskSubdomain

//TODO - optimize so that you always get all 10 pages

//-----PACKAGES, GLOBAL VAR, ETC-----
const requestHandler = require(`./helper-functions/handle-request`);
const dateHandler = require(`./helper-functions/get-past-date`);
const jsonToExcelConverter = require(`./helper-functions/json-to-excel-file.js`);
const chalk = require('chalk');
const subdomainName = process.argv[5]

var dateXMonthsAgoAsString = ''
var dateXMonthsAgoPlusOne = ''
var dateXMonthsAgoPlusTwoWk = ''
var maxPgNum = 10; //see https://developer.zendesk.com/rest_api/docs/support/search "results limit" section, 10pg max

// requester id functions
const getAllRequesterIds = async () => {
    console.log('start method getAllRequesterIds')
    const allRequesterIdsArr = [];
    for (var numMonths = process.argv[4]; 0 < numMonths; numMonths--) {
        var requesterIdsByMonth = await getRequesterIdsByMonth(numMonths)
        allRequesterIdsArr.push(requesterIdsByMonth)
    }
    console.log('finish method getAllRequesterIds')
    return allRequesterIdsArr
}
const getRequesterIdsByMonth = async (monthNum) => {
    console.log("start function getRequesterIdsByMonth")
    console.log('month num is ' + monthNum)
    try {
        dateXMonthsAgoAsString = dateHandler.getDateXMonthsAgo(monthNum).toISOString();
        dateXMonthsAgoPlusOne = dateHandler.getDateXMonthsAgo(monthNum - 1).toISOString();
        dateXMonthsAgoPlusTwoWk = dateHandler.getDateXMonthsAgoPlusDays(monthNum, 14).toISOString();
        console.log(chalk.blue('Getting Requester IDs from ' + dateXMonthsAgoAsString + ' to ' + dateXMonthsAgoPlusOne))
    } catch (err) {
        console.log(chalk.red('error getting # months to pull - have you entered a integer on the cmd line?\n' + err))
    }

    var requesterIdsForMonthArr = []
    try {
        for (pgNum = 1; pgNum <= maxPgNum; pgNum++) {
            console.log(chalk.blue(`Getting organization IDs for page ${pgNum}...`))
            try {
                var ticketsApiCall = `https://${subdomainName}.zendesk.com/api/v2/search.json?page=${pgNum}&query=via:mail+via:web+created>${dateXMonthsAgoAsString}+created<${dateXMonthsAgoPlusOne}&sort_by=created_at&sort_order=asc`
                var apiRequest = await requestHandler.handleRequest("GET", ticketsApiCall)
                if (apiRequest.next_page) {
                    console.log("results were present in pg " + pgNum)
                    if (pgNum == 10) {
                        console.log(chalk.red('10 or more results!'))
                    }
                    var requesterIds = apiRequest.results
                    .map(result => result.requester_id)
    
                    requesterIdsForMonthArr.push(requesterIds)
                } else {
                    break;
                }
            } catch (err) {
                console.trace("error getting data for the month! " + err)
            }
        }
        console.log(chalk.green('Page retrieval is complete!'))
        return requesterIdsForMonthArr.flat()
    } catch (err) {
        console.trace(chalk.red(`error with function getOrgIdsByPage: ${err}`))
        return
    }
    
}

//customer info (besides name) functions
const getAllCustomerInfo = async (nonUniqueReqIds) => {
    var flatUniqueReqIds = [...new Set(nonUniqueReqIds.flat())]
    console.log(flatUniqueReqIds)
    console.log(`object size is ` + flatUniqueReqIds.length)
    console.log(chalk.green('unique org ID set generated!'))
    console.log(chalk.blue('getting customer information by org ID...'))

    let customerInfoByRequesterId = '';
    var allCustomerInfoArr = []
    for (var i = 0; i < flatUniqueReqIds.length; i++) {
            try {
                customerInfoByRequesterId = await getCustomerInfoByRequesterId(flatUniqueReqIds[i])
                if (customerInfoByRequesterId) {
                    console.log('name is ' + customerInfoByRequesterId.user.name)
                    const neededInfoArr = (({ email, name, phone, organization_id }) => ({ email, name, phone, organization_id }))(customerInfoByRequesterId.user)    
                    allCustomerInfoArr.push(neededInfoArr)
                }
            } catch (err) {
                console.trace(chalk.red('Error with function getAllCustomerInfo! ' + err))
            }
    }
    console.log(chalk.green('unique customer Email list generated for all orgs!'))
    console.log('unflattened, allCustomerInfoArr has ' + allCustomerInfoArr.length + ' entries.')
    console.log('flattened, allCustomerInfoArr has ' + allCustomerInfoArr.flat().length + ' entries.')
    console.log('you have this many entries in the all customer info array: ' + allCustomerInfoArr.length)
    return allCustomerInfoArr.flat()
}
const getCustomerInfoByRequesterId = async (uniqueRequesterId) => {
    try {
        var apiString = `https://${subdomainName}.zendesk.com/api/v2/users/${uniqueRequesterId}`
        return await requestHandler.handleRequest("GET", apiString)
    } catch (err) {
        console.trace(chalk.red(`Error getting customer information for requester ID ${uniqueOrgId}: ${err}`))
    }
}

// customer name functions
const assignCompanyNamesToCustomers = async (customerListWoCompany) => {
    const uniqueOrgIdList = customerListWoCompany.map(item => item.organization_id);
    uniqueOrgIdList.forEach(item=>console.log('unique org id is ' + item))
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
const getCompanyNamesById = async (idList) => {
    console.log('id list is ' + idList.length + 'ids long')
    try {
        const companyIdAndNameArr = [];
        for (var i in idList) {
            const companyNameObj = await getCompanyName(idList[i])
            if (companyNameObj) {
                const companyName = companyNameObj.organization.name
                console.log(chalk.blue('company name is ' + companyName))
                companyIdAndNameArr.push({
                    "organization_id": idList[i],
                    "companyName": companyName
                })
            }
        }
        return companyIdAndNameArr
    } catch (err) {
        console.trace(chalk.red('error getting company names by ID ' + err))
        return
    }
}
const getCompanyName = async (companyOrgId) => {
    console.log('company org i')
    try {
        if (companyOrgId) {
            var apiString = `https://${subdomainName}.zendesk.com/api/v2/organizations/${companyOrgId}`
            return await requestHandler.handleRequest("GET", apiString)
        } else {
            console.log(chalk.red('no organization ID for this user! Skipping user'))
        }
    } catch (err) {
        console.trace(chalk.red(`Error getting company name: ${err}`))
        return
    }
}

//-----Main Process-----
//1. GET ORGANIZATION IDS
getAllRequesterIds() 
    .then(async resultsArr => {  //2. GET CUSTOMER INFO
        return await getAllCustomerInfo(resultsArr) 
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