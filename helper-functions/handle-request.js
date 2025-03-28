//usage: appName ${apiUsername} ${apiPassword}
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const chalk = require('chalk')
var xhttp;
var username = process.argv[2];
var password = process.argv[3];

const handleRequest = (method, path, payload = {}) => {
    return new Promise((resolve, reject) => {
        xhttp = new XMLHttpRequest();
        xhttp.open(method, path);
        xhttp.setRequestHeader("Content-Type", "application/json");
        var authHeader = Buffer.from(`${username}:${password}`).toString('base64');
        xhttp.setRequestHeader("Authorization", `Basic ${authHeader}`);
        xhttp.onload = () => {
            if (xhttp.status >= 200 && xhttp.status < 300) {
                resolve(JSON.parse(xhttp.responseText));
            } else {
                reject(chalk.red('Bad HTTP Status Code! ' + xhttp.status + ' ' + xhttp.statusText + ' Have you entered your user/pw combo in the CLI?'));
            }
        }
        xhttp.onerror = () => reject("API call rejected! " + xhttp.status + " " + xhttp.statusText)
        JSON.stringify(payload);
        xhttp.send(payload);
    })
}

const handleRequestSync = (method, path, payload = {}) => {
    console.log('handling request synchronously')
    xhttp = new XMLHttpRequest();
    xhttp.open(method, path, false);
    xhttp.setRequestHeader("Content-Type", "application/json");
    try {
        var authHeader = Buffer.from(`${username}:${password}`).toString('base64');
    } catch (err) {
        console.log('error making synchronous request: ' + err)
    }
    
    console.log('Buffer has been created')
    xhttp.setRequestHeader("Authorization", `Basic ${authHeader}`);
    JSON.stringify(payload);
    xhttp.send(payload);
    if (xhttp.status != 200) {
        console.log(chalk.red(`Error ${xhttp.status}: ${xhttp.statusText}`));
    } else {
        return JSON.parse(xhttp.responseText)
    }
}

//todo - fix this it is currently not working
//msForOneCall - number of milliseconds for each call. 1000 = 1 call is made every 1 second
const handleRequestThrottled = (method, path, msForOneCall) => {
    console.log('Resolving Throttled ?: ')
    return new Promise((resolve, reject) => {
        setTimeout(function () {
            console.log('Resolving Throttled: ')
            resolve(handleRequest(method, path))
            reject(err => console.log('error making throttled request - ' + err))
        }, msForOneCall)
    })
}

exports.handleRequest = handleRequest
exports.handleRequestSync = handleRequestSync
exports.handleRequestThrottled = handleRequestThrottled
