COUNT="some"
DIRNAME="your watched directory"

if [ -n "$1" ] && [ -d "$1" ]; then
    COUNT="$(expr "$(ls -a "$1" | wc -l)" - 2)"
    DIRNAME="$1"
fi

ID="$(echo $RANDOM | md5sum | tr -d ' -')"

if [ -n "$2" ]; then
    ID="$2"
fi

curl -s -H "Encryption Dropoff" -d "There are "$COUNT" items in "$DIRNAME"." ntfy.sh/"$ID" > /dev/null