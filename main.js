const uk = require('./uk.js')
const eu = require('./eu.js')
const station = require('./station.js')

exports.station = station

const London = "8267"

// from: origin, as a string identifier from data/stations.json.
// to: destination, as a string identifier too.
// options:
// - departure: local time of departure, as a Date object.
// Returns a promise for a list of travel plans
// { fares: [{price: [{cents, currency}], class, flexibility}],
//   legs: [{from, to, departure, arrival}] }
// from and to can either be a string identifier or {name, latitude, longitude}.
exports.search =
function search(from, to, options) {
  options = options || {}
  let departure = options.departure || new Date()
  let origin = station.id(from)
  let destination = station.id(to)

  // Is this UK-only, or EU-only?
  if (origin.country === 'GB' && destination.country === 'GB') {
    return uk.search(from, to, options)
  } else if (stationEuCompatible(origin) && stationEuCompatible(destination)) {
    return eu.search(from, to, options)
  } else {
    if (origin.country === 'GB') {
      return uk.search(from, London, options)
      .then(ukTravelPlan => {
        let legs = ukTravelPlan[0].legs
        options.departure = new Date(legs[legs.length - 1].arrival)
        return eu.search(London, to, options)
        .then(euTravelPlan => combineSearch(ukTravelPlan, euTravelPlan))
      })
    } else {  // Going from europe to the UK.
      return eu.search(from, London, options)
      .then(euTravelPlan => {
        let legs = euTravelPlan[0].legs
        options.departure = new Date(legs[legs.length - 1].arrival)
        return uk.search(London, to, options)
        .then(ukTravelPlan => combineSearch(euTravelPlan, ukTravelPlan))
      })
    }
  }
}

// Take two travel plans, combine them so that one is the first part of the
// journey of the other. We assume that the last station of the first travel
// plans is the first station of the second travel plans.
function combineSearch(tp1, tp2) {
  return tp1.map(travelPlan => {
    let arrival = new Date(travelPlan.legs[travelPlan.legs.length - 1].arrival)
    let bestWaitTime = Infinity
    let bestTravelPlan2 = tp2[0]
    // Find the most appropriate corresponding second travel plan.
    for (let i = 0; i < tp2.length; i++) {
      let travelPlan2 = tp2[i]
      let departure = new Date(travelPlan2.legs[0].departure)
      let waitTime = departure - arrival
      if (waitTime > 0) {
        if (waitTime < bestWaitTime) {
          bestWaitTime = waitTime
          bestTravelPlan2 = travelPlan2
        }
      }
    }
    return {
      fares: combineFares(travelPlan.fares, bestTravelPlan2.fares),
      legs: travelPlan.legs.slice().concat(bestTravelPlan2.legs.slice()),
    }
  })
}

function combineFares(fares1, fares2) {
  let fares = []
  return fares1.map(fare => {
    let bestScore = 0
    let bestFare2 = fares2[0]
    for (let i = 0; i < fares2.length; i++) {
      let fare2 = fares2[i]
      let score = 0
      if (fare.class === fare2.class) { score++ }
      if (fare.flexibility === fare2.flexibility) { score++ }
      if (fare.flexibility <= fare2.flexibility) { score++ }
      if (score > bestScore) {
        bestScore = score
        bestFare2 = fare2
      }
    }
    return {
      // They are both mono-currency.
      price: [fare.price[0], bestFare2.price[0]],
      class: fare.class,
      flexibility: fare.flexibility,
    }
  })
}

function stationEuCompatible(station) {
  let english = (station.country === 'GB')
  let london = /london/i.test(station.name)
  return (!english) || london
}
