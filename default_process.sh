if [ -z "$1" ] || [ ! -d "$1" ]; then
    echo "Provide a valid directory as an argument!" >&2
    ecit 1
fi

HERE="$(pwd)"
trap "cd "$HERE"" EXIT

find . -type f -maxdepth 1 | while read -r file; do
    dir="$(dirname "$file")"
    filename="$(basename "$file")"
    echo ""
    creation_date=$(ls -lc --time-style=+"%Y-%m-%d %H%M" "$file" | awk '{print $6,$7}')
    if [[ $filename == .* ]]; then
        creation_date="."$creation_date""
    fi
    finalpath="$dir"/"$creation_date"" - ""$filename"
    echo mv "$file" "$finalpath"
    echo ""
done
