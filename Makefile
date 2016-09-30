data/stations.json: data/stations.csv
	./data/mk-json-stations.sh

data/stations.csv:
	curl 'https://raw.githubusercontent.com/trainline-eu/stations/master/stations.csv' > data/stations.csv
