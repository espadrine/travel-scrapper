const station = require('./station.js')
const request = require('request')
const crypto = require('crypto')

const searchUrl = 'https://www.trainline.eu/api/v5/search'
const searchCarriers = ['sncf','db','busbud','idtgv','ouigo','trenitalia','ntv','hkx','renfe','timetable']

// from: origin, as a string identifier from data/stations.json.
// to: destination, as a string identifier too.
// options:
// - departure: local time of departure, as a Date object.
// Returns a promise for a list of travel plans.
exports.search =
function search(from, to, options) {
  let departure = options.departure || new Date()

  let form = {
    search: {
      departure_date: departure.toISOString(),
      departure_station_id: from,
      arrival_station_id: to,
      passengers: [{
        id: uuid(),
        label: 'adult',
        age: 27,
      }],
      systems: searchCarriers,
    }
  }

  return new Promise((resolve, reject) => {
    request.post(searchUrl, {json: form}, function(err, res, json) {
      if (err != null && res.statusCode !== 200) {
        reject(err || new Error('Accessing EU information failed during search'))
        return
      }
      if (json.errors && json.errors.length > 0) {
        reject(err || new Error('Searching for EU information: ' +
              json.errors.join(', ')))
        return
      }
      resolve(extractTravelPlan(json))
    })
  })
}

// data: {folders, trips, segments, comfort_classes, conditions, passengers,
//   stations, search}
// Return data conforming to the common travel plan format.
function extractTravelPlan(data) {
  let plans = []
  let getPlan = searchPlan => plans.find(plan => samePlan(plan, searchPlan))

  data.folders.forEach(folder => {
    let cents = folder.cents
    if (folder.cents === undefined) { return }
    let from = stationDataFromId(folder.departure_station_id, data)
    let to = stationDataFromId(folder.arrival_station_id, data)
    let departure = (new Date(folder.departure_date)).toISOString()
    let arrival = (new Date(folder.arrival_date)).toISOString()

    let tripId = folder.trip_ids[0]
    let trip = data.trips.find(trip => trip.id === tripId)
    let segments = trip.segment_ids.map(segmentId =>
      data.segments.find(segment => segment.id === segmentId)
    )
    let legs = segments.map(segment => ({
      from: stationDataFromId(segment.departure_station_id, data),
      to: stationDataFromId(segment.arrival_station_id, data),
      departure: (new Date(segment.departure_date)).toISOString(),
      arrival: (new Date(segment.arrival_date)).toISOString(),
    }))
    let searchPlan = {fares: [], legs}
    let plan = getPlan(searchPlan)

    if (plan === undefined) {
      plan = searchPlan
      plans.push(plan)

    } else if
      // If that price is already in the plan, no need to add to it.
      (plan.fares.find(fare => fare.price[0].cents === cents) !== undefined) {
      return
    }


    plan.fares.push({
      price: [{ cents: folder.cents, currency: folder.currency }],
      class: travelClass(folder.travel_class),
      flexibility: flexibility(folder.flexibility),
    })
  })
  return plans
}

// "economy" or "first"
function travelClass(tc) {
  if (tc === "first") { return 1
  } else { return 2 }
}

function flexibility(f) {
  if (f === "nonflexi") { return 1
  } else if (f === "semiflexi") { return 2
  } else { return 3 }
}

function stationDataFromId(id, data) {
  let s = station.id(id)
  if (s !== undefined) {
    return s
  } else {
    return data.stations.find(s => s.id === id)
  }
}

function samePlan(a, b) {
  return a.legs.reduce((acc, leg, i) => {
    if (!acc) { return false }
    let bleg = b.legs[i]
    let sameDeparture = (leg.departure === bleg.departure)
    let sameArrival = (leg.arrival === bleg.arrival)
    let sameOrigin = (leg.from === bleg.from) ||
      ((leg.from.name !== undefined) && (bleg.from.name !== undefined) &&
       (leg.from.name === bleg.from.name))
    let sameDestination = (leg.to === bleg.to) ||
      ((leg.to.name !== undefined) && (bleg.to.name !== undefined) &&
       (leg.to.name === bleg.to.name))
    return sameDeparture && sameArrival && sameOrigin && sameDestination
  }, true)
}

function uuid() {
  let b = crypto.randomBytes(31)
  let i = 0
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    let hn = b[i] & 0xf  // hex number
    i++
    let v = hn
    if (c === 'y') { v = (hn & 0x3 | 0x8) }
    return v.toString(16)
  })
}
