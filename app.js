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

const express = require('express')
const path = require('path')
const fs = require('fs')
const child_process = require('child_process')

const environment = require('./environment')

fs.watch(environment.WATCH_DIR_PATH, (event, file) => {
  if (event == 'rename' && fs.existsSync(file)) {
    try {
      console.log(child_process.execSync(`bash "${environment.NOTIF_SCRIPT_PATH}" ${environment.NOTIF_SCRIPT_ARGS || ''}`))
    } catch (e) {
      console.error(e)
    }
  }
})

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }))
app.post('/process', (req, res) => {
  try {
      if (!req.body.password) {
          throw 'No password provided'
      }
      // TODO: Act
      res.send()
  } catch (err) {
      console.log(`Failed process attempt with body: ${JSON.stringify(req.body)}`)
      console.log(err)
      res.status(400).send()
  }
})