/**

TODO:
- Given a config with:
  - A VC Container
  - A folder
  - An optional "notification" script (if none, use a default)
  - An optional "prepare files" shell script (if none, use a default)
- Watch the folder for new files and run the notification script when there are new files
  - The default notification script generates a random string and sends a notification to ntfy.sh with that ID
- Serve a simple webpage with a single password field
- When someone uses the page:
  - Use their password to open the VC Container
  - Run the "prep files" script on the folder
    - By default, this uses the files' "created date" to prefix file names with a datetime string
  - Move all files in the folder into the container
  - Close the container
  - Return a result/error to show on the webpage
    - Note: Given that it might take a long time to do this, ensure the connection is kept alive while they wait
- Dockerize

*/