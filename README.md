```js
const travel = require('travel-scrapper')
const Manchester = travel.station.name('Manchester').id
const Milano = travel.station.name('Milano').id
// Search for a journey from Manchester to Milano right now.
travel.search(Manchester, Milano, {departure: new Date()})
.then(travelPlans => {})
// Travel plans are of the form:
// { fares: [{price: [{cents, currency}], class, flexibility}],
//   legs: [{from, to, departure, arrival}] }
// from and to can either be a string identifier (`station.id(…)`)
// or {name, latitude, longitude}.
```

# UK trains
```
# Get cookies from https://www.thetrainline.com.
curl 'https://www.thetrainline.com/buytickets/' --data 'OriginStation=London&DestinationStation=Manchester+Piccadilly&RouteRestriction=NULL&ViaAvoidStation=&outwardDate=25-Sep-16&OutwardLeaveAfterOrBefore=A&OutwardHour=19&OutwardMinute=30&returnDate=&InwardLeaveAfterOrBefore=A&ReturnHour=&ReturnMinute=&AdultsTravelling=1&ChildrenTravelling=0&ExtendedSearch=Get+times+%26+tickets'
# Follow the redirection, get the HTML, extract `form#timetable[data-defaults]`.
# Warning: this does not include station transfers.
```

# EU trains
```
curl 'https://www.trainline.eu/api/v5/stations?context=search&q=Lyon'
# Get the station id.
# Alternatively, get all station ids at https://github.com/captaintrain/stations
curl 'https://www.trainline.eu/api/v5/search'  --data-binary '{"search":{"departure_date":"2016-09-29T08:00:00UTC","return_date":null,"passengers":[{"id":"920701f8-7aac-499c-bd65-3606986fbe65","label":"adult","age":27,"cards":[],"cui":null}],"systems":["sncf","db","busbud","idtgv","ouigo","trenitalia","ntv","hkx","renfe","timetable"],"exchangeable_part":null,"departure_station_id":"4916","via_station_id":null,"arrival_station_id":"4718","exchangeable_pnr_id":null}}'
# Get the JSON.
```

