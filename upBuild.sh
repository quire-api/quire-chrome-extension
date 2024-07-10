#! /bin/bash
if [ "$#" -lt 2 ]; then
	echo "Usage: ./upBuild.sh #quire-build #plugin-version"
	echo "Example: ./upBuild.sh 435 0.8.8"
	exit 0
fi
BUILD=$1
VERSION=$2

for file in $(ls *html)
do
	echo "update build number: $file"
	sed -i '' "s#.io/b.*r/mesg#.io/b$BUILD/r/mesg#g" $file
	sed -i '' "s#.io/b.*s/js/pack#.io/b$BUILD/s/js/pack#g" $file
done

for file in $(ls *js)
do
	echo "update plugin version: $file"
	sed -i '' "s#Chrome-Extension .*\$#Chrome-Extension $VERSION\"}#g" $file
done

echo "update plugin version: manifest.json"
sed -i '' "s#\"version\": .*\$#\"version\": \"$VERSION\",#g" manifest.json
