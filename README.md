# README #

Zendesk User Retrieval App. This set of command line scripts allows users to retrieve Zendesk user information in two ways:
1. userListByTickets - fetches a list of active users from a Zendesk account over a specified period (in months)
2. activeCompaniesUserListByTickets = fetches a list of active users in Zendesk who have interacted (via tickets) within a specified number of months
The data is written to an Excel document after it is fetched.

The scripts can be used to create custom sales and marketing material for small businesses which utilize the Zendesk platform.

## Usage ##

The scripts each take four inputs:

process.argv[2] → Zendesk API username
process.argv[3] → Zendesk API password
process.argv[4] → Number of months of data to pull
process.argv[5] → Zendesk subdomain name

### Step 1: install Node ###

https://docs.npmjs.com/downloading-and-installing-node-js-and-npm

### Step 2: cd into your local project directory and install necessary packages on your local machine ###

npm install xmlhttprequest
npm install chalk
npm install exceljs
npm install fs

### Step 3: run with necessary parameters ###

node activeCompaniesUserListByTickets username password 12 mySubdomain
node userListByTickets username password 12 mySubdomain