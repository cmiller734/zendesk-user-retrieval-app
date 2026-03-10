# README #

Zendesk User Retrieval App. This set of command line scripts allows users to retrieve Zendesk user information in two ways:
1. userListByTickets - fetches a list of active users from a Zendesk account over a specified period (in months)
2. activeCompaniesUserListByTickets = fetches a list of active users in Zendesk who have interacted (via tickets) within a specified number of months
The data is written to an Excel document after it is fetched.

The scripts can be used to create custom sales and marketing material for small businesses which utilize the Zendesk platform.

## Usage ##

The scripts now expect Zendesk credentials from environment variables:

`ZENDESK_EMAIL` → Zendesk API username/email
`ZENDESK_PASSWORD` → Zendesk API password
`ZENDESK_SUBDOMAIN` → Zendesk subdomain name

The scripts take:

`process.argv[2]` → Number of months of data to pull
`process.argv[3]` → Optional Zendesk subdomain name if `ZENDESK_SUBDOMAIN` is not set

### Step 1: install Node ###

https://docs.npmjs.com/downloading-and-installing-node-js-and-npm

### Step 2: cd into your local project directory and install necessary packages on your local machine ###

npm install xmlhttprequest
npm install chalk
npm install exceljs
npm install fs

### Step 3: run with necessary parameters ###

```bash
export ZENDESK_EMAIL="username"
export ZENDESK_PASSWORD="password"
export ZENDESK_SUBDOMAIN="mySubdomain"

node activeCompaniesUserListByTickets.js 12
node userListByTickets.js 12
```
