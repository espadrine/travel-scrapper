#/bin/bash

tmpfile=`mktemp`
cat data/stations.csv | tail -n +2 |  # The first line is a header.
  cut -f 1,2,10,12 -d ';' |  # Keep the id and the name. 
  sed 's/"/\\"/g' |    # JSON string escaping.
  sed 's/^\([0-9]\+\);\([^;]*\);\([^;]*\);\([^;]*\)$/{"id":"\1","name":"\2","country":"\3","timezone":"\4"},/' |
  head -c -2 > $tmpfile  # Remove the last comma in the list.
(echo -n '['; cat $tmpfile; echo ']') > data/stations.json
rm $tmpfile
