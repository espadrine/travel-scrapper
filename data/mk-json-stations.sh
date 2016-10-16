#/bin/bash

tmpfile=`mktemp`
cat data/stations.csv | tail -n +2 |  # The first line is a header.
  cut -f 1,2,6,7,10,12 -d ';' |  # id, name, lat, long, country, timezone
  sed 's/"/\\"/g' |    # JSON string escaping.
  sed 's/^\([0-9]\+\);\([^;]*\);\([^;]*\);\([^;]*\);\([^;]*\);\([^;]*\)$/{"id":"\1","name":"\2","lat":"\3","long":"\4","country":"\5","timezone":"\6"},/' |
  head -c -2 > $tmpfile  # Remove the last comma in the list.
(echo -n '['; cat $tmpfile; echo ']') > data/stations.json
rm $tmpfile
