const stations = require('./data/stations.json')

let stationFromId = new Map()
let stationFromName = new Map()
stations.forEach(station => {
  stationFromId.set(station.id, station)
  stationFromName.set(station.name, station)
})

module.exports = stations
module.exports.id = function id(id) { return stationFromId.get(id) }
module.exports.name = function name(name) { return stationFromName.get(name) }
