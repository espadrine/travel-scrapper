const station = require('./station.js')

// from: origin, as a string identifier from data/stations.json.
// to: destination, as a string identifier too.
// options:
// - departure: local time of departure, as a Date object.
// Returns a promise for a list of travel plans.
exports.search =
function search(from, to, options) {
  let departure = options.departure || new Date()
  let origin = station.id(from)
  let destination = station.id(to)
  return Promise.reject(new Error("The EU is not implemented yet."))
}
