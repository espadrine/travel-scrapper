const station = require('./station.js')
const requestLib = require('request')
const rootUrl = 'https://www.thetrainline.com/'
const searchUrl = 'https://www.thetrainline.com/buytickets/'

const months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
  'Oct', 'Nov', 'Dec' ]
let month = new Map()
months.forEach((m, i) => month.set(m, i + 1))

let cookieJar = requestLib.jar()
const request = requestLib.defaults({jar: cookieJar})

// from: origin, as a string identifier from data/stations.json.
// to: destination, as a string identifier too.
// options:
// - departure: local time of departure, as a Date object.
// - passengers: list of {birthdate, documents, gender}
// Returns a promise for a list of travel plans.
exports.search =
function search(from, to, options) {
  let departure = options.departure || new Date()
  let origin = station.id(from)
  let destination = station.id(to)

  const dd = departure.getDate().toString()
  const dm = months[departure.getMonth()]
  const dy = departure.getFullYear().toString().slice(2)
  const dh = departure.getHours().toString()
  const dmin = departure.getMinutes().toString()
  let form = {
    "OriginStation": origin.name,
    "DestinationStation": destination.name,
    "RouteRestriction": "NULL",
    "ViaAvoidStation": "",
    "outwardDate": `${dd}-${dm}-${dy}`,
    "OutwardLeaveAfterOrBefore": "A",
    "OutwardHour": dh,
    "OutwardMinute": dmin,
    "returnDate": "",
    "InwardLeaveAfterOrBefore": "A",
    "ReturnHour": "",
    "ReturnMinute": "",
    "AdultsTravelling": "1",
    "ChildrenTravelling": "0",
    "ExtendedSearch": "Get times & tickets"
  }

  return new Promise((resolve, reject) => {
    getCookies().then(() => {
      request.post(searchUrl, {form: form, followAllRedirects: true},
      function(err, res, body) {
        if (err != null && res.statusCode !== 200) {
          reject(err || new Error('Accessing UK information failed during search'))
          return
        }
        let scrapped = searchHtmlScrapper.exec(body)
        if (scrapped === null || !scrapped[1]) {
          reject(new Error('Extracting UK information failed during search'))
          return
        }
        let data, travelPlan
        try {
          data = JSON.parse(scrapped[1].replace(/\\/g, '\\'))
          travelPlan = extractTravelPlan(data)
        } catch(e) {
          reject(e)
          return
        }
        resolve(travelPlan)
      })
    })
    .catch(e => reject(e))
  })
}

const searchHtmlScrapper = / id="timetable" data-module="CombinedMatrix" data-defaults='([^']+)'/

// Get raw scrapping data
// Return data conforming to the common travel plan format.
function extractTravelPlan(data) {
  let tickets = data.fullJourneys[0].cheapestTickets
  if (!tickets || tickets.length === 0) { return [] }
  let secondClass = tickets[0].tickets
  let firstClass = tickets[1].tickets
  let journeys = data.fullJourneys[0].journeys
  let date = data.fullJourneys[0].date  // "25 Sep 2016"

  let journeyFromId = []
  journeys.forEach(journey => journeyFromId[journey.id] = journey)

  let plans = []
  let getPlan = (from, to, departure, arrival) => {
    return plans.find(plan =>
      (plan.legs[0].from === from) && (plan.legs[0].to === to) &&
      (plan.legs[0].departure === departure) && (plan.legs[0].arrival === arrival))
  }

  let mkticket = (ticket, travelClass) => {
    let journey = journeyFromId[ticket.journeyId]
    let price = ticket.price  // "81.40"
    if (!journey || !price) { return }
    let origin = station.name(journey.departureName)
    let destination = station.name(journey.arrivalName)

    let from = origin ? origin.id : journey.departureName
    let to = destination ? destination.id : journey.arrivalName
    let departure = String(parseTime(date, journey.departureTime))
    let arrival = String(parseTime(date, journey.arrivalTime))
    let plan = getPlan(from, to, departure, arrival)
    if (plan === undefined) {
      plan = {
        fares: [],
        legs: [{from, to, departure, arrival}],
      }
      plans.push(plan)
    }

    plan.fares.push({
      class: travelClass,
      flexibility: 1,
      price: [{ cents: parsePrice(ticket.price), currency: 'GBP' }],
    })
  }
  secondClass.map(ticket => mkticket(ticket, 2))
  firstClass.map(ticket => mkticket(ticket, 1))
  return plans
}

// "81.40" → 8140
function parsePrice(price) {
  let parts = price.split('.')
  return ((+parts[0]) * 100) + (+parts[1])
}

// FIXME: timezones and daylight saving time.
let ukTz = "+01:00"

// ("25 Sep 2016", "20:55") → Date
function parseTime(date, time) {
  let dateParts = date.split(' ')
  let mon = String(month.get(dateParts[1]))
  if (mon.length < 2) { mon = '0' + mon }
  let day = dateParts[0]
  if (day.length < 2) { day = '0' + day }
  return new Date(`${dateParts[2]}-${mon}-${day}T${time}${ukTz}`)
}

// Return a promise.
function getCookies() {
  return new Promise((resolve, reject) => {
    request.get(rootUrl, function(err, res, body) {
      if (err != null && res.statusCode !== 200) {
        reject(err || new Error('Accessing UK information failed'))
        return
      }
      resolve()
    })
  })
}
