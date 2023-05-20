# Prep args
if [ -z "$1" ] || [ ! -d "$1" ]; then
    echo "Provide a valid directory as an argument!" >&2
    exit 1
fi
DIRNAME="$1"

# Give all files a 'YYYY-MM-DD HHMM - ' prefix from their created date
HERE="$(pwd)"
trap "cd "$HERE"" EXIT
find "$DIRNAME" -type f | while read -r file; do
    dir="$(dirname "$file")"
    filename="$(basename "$file")"
    creation_date=$(ls -l --time-style=+"%Y-%m-%d %H%M" "$file" | awk '{print $6,$7}')
    if [[ $filename == .* ]]; then
        creation_date="."$creation_date""
    fi
    finalpath="$dir"/"$creation_date"" - ""$filename"
    mv "$file" "$finalpath"
done
cd "$HERE"