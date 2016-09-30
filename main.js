const uk = require('./uk.js')
const eu = require('./eu.js')
const station = require('./station.js')

exports.station = station

// from: origin, as a string identifier from data/stations.json.
// to: destination, as a string identifier too.
// options:
// - departure: local time of departure, as a Date object.
// Returns a promise for a list of travel plans.
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
    return uk.search(from, to, options)
  } else {
    return Promise.reject(new Error("This trip crosses the English Channel."))
  }
}

function stationEuCompatible(station) {
  let english = (station.country === 'GB')
  let london = /london/i.test(station.name)
  return (!english) || london
}
