# Prep args
if [ -z "$1" ] || [ ! -d "$1" ]; then
    echo "Provide a valid directory as an argument!" >&2
    exit 1
fi
DIRNAME="$1"
ID="$(echo $RANDOM | md5sum | tr -d ' -')"
if [ -n "$2" ]; then
    ID="$2"
fi
WAIT=0
if [ -n "$3" ]; then
    WAIT="$3"
fi

# Send a ntfy.sh notification with the number of files (use a random ID if one is not specified)
sleep "$WAIT"
COUNT="$(ls -A "$1" | grep -Ev '^\.(stfolder|stversions|stignore)$' | wc -l)"
if [ "$COUNT" != "0" ]; then
    curl -s -H "Encryption Dropoff" -d "There are "$COUNT" item(s) in "$DIRNAME"." ntfy.sh/"$ID"
else
    echo "No items in "$DIRNAME""
fi