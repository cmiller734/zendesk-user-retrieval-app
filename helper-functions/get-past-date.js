//currently not exact months ago to the day (doesnt account leap year etc) - but works in context. accounts for Daylight Savings
// var date;
const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate()

const getDateXMonthsAgo = (months) => {
    const date = new Date();
    date.setMonth(date.getMonth() - months)
    date.setDate(Math.min(date.getDate(), getDaysInMonth(date.getFullYear(), date.getMonth() + 1)))
    return date 
}

const getDateXMonthsAgoPlusDays = function(months, noOfDays) {
    const dateXMonthsAgoPlusDays = this.getDateXMonthsAgo(months)
    dateXMonthsAgoPlusDays.setTime(dateXMonthsAgoPlusDays.getTime() + (noOfDays * (1000 * 60 * 60 * 24)));
    return dateXMonthsAgoPlusDays;
}

exports.getDateXMonthsAgo = getDateXMonthsAgo
exports.getDateXMonthsAgoPlusDays = getDateXMonthsAgoPlusDays

//usage: 
//var dateSixMonthsAgo = dateHandler.addMonths(today, -6)
//returns Date object
