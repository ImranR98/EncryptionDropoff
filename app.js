const express = require('express')
const path = require('path')
const fs = require('fs')
const child_process = require('child_process')

const environment = require('./environment')

fs.watch(environment.WATCH_DIR_PATH, (event, file) => {
  if (event == 'rename' && fs.existsSync(file)) {
    try {
      console.log(child_process.execSync(`bash "${environment.NOTIF_SCRIPT_PATH}" "${environment.WATCH_DIR_PATH}" ${environment.NOTIF_SCRIPT_ARGS || ''}`))
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
  let mountDir = null
  try {
    if (!req.body.password) {
      throw 'No password provided'
    }
    mountDir = fs.mkdtempSync()
    child_process.execSync(`veracrypt -t --non-interactive -p '${req.body.password}' '${environment.VC_CONTAINER_PATH}' '${mountDir}'`)
    child_process.execSync(`bash "${environment.PROCESS_SCRIPT_PATH}" "${mountDir}" ${environment.PROCESS_SCRIPT_ARGS || ''}`)
    res.send()
  } catch (err) {
    console.log(`Failed process attempt with body: ${JSON.stringify(req.body)}`)
    console.log(err)
    res.status(400).send()
  } finally {
    try {
      child_process.execSync(`veracrypt -t -d '${environment.VC_CONTAINER_PATH}'`)
      if (mountDir) {
        fs.unlinkSync(mountDir)
      }
    } catch {
      // ignore
    }
  }
})