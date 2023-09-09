# Usage: default_notif.sh <directory> <ntfy topic> <ntfy server> <ntfy token>

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
URL="ntfy.sh"
if [ -n "$3" ]; then
    URL="$3"
fi
TOKEN=""
if [ -n "$4" ]; then
    TOKEN="$4"
fi

# Send a ntfy.sh notification with the number of files (use a random ID if one is not specified)
COUNT="$(ls -A "$1" | grep -Ev '^\.(stfolder|stversions|stignore)$' | wc -l)"
if [ "$COUNT" != "0" ]; then
    CURL_ARGS="-s -H \"Encryption Dropoff\" -d \"There are "$COUNT" item(s) in "$DIRNAME".\" \""$URL"/"$ID\"""
    if [ -n "$TOKEN" ]; then
        CURL_ARGS="-u \":"$TOKEN"\" "$CURL_ARGS""
    fi
    eval "curl "$CURL_ARGS""
else
    echo "No items in "$DIRNAME""
fi
