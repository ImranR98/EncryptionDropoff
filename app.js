const express = require('express')
const path = require('path')
const fs = require('fs')
const child_process = require('child_process')

const environment = require('./environment')

const formatDate = (date) => {
  let year = date.getFullYear();
  let month = ("0" + (date.getMonth() + 1)).slice(-2);
  let day = ("0" + date.getDate()).slice(-2);
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  hours = hours < 10 ? '0' + hours : hours;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  let strTime = hours + ':' + minutes + ' ' + ampm;
  return year + '-' + month + '-' + day + ' ' + strTime;
}
const log = (data, isErr = false, skipLines = 0) => {
  let skips = ''
  for (let i = 0; i < skipLines; i++) {
    skips += '\n'
  }
  console[isErr ? 'error' : 'log'](`${skips}${formatDate(new Date())}: ${data.toString()}`)
}

const exec = (command, logOnSuccess = false) => {
  let out = null
  let err = null
  try {
    out = child_process.execSync(`${command} 2>&1`).toString().trim()
  } catch (e) {
    err = e.toString().trim()
  }
  if (err) {
    log('\n' + err)
  }
  if (out && logOnSuccess) {
    log('\n' + out)
  }
}

const shouldIgnoreFile = (fileName) => {
  // Hardcoded syncthing-related files for now - can be user-defined in the future
  if (fileName.startsWith('.syncthing') && fileName.endsWith('.tmp')) {
    return true
  }
  if (fileName == '.stfolder' || fileName == '.stversions') {
    return true
  }
  return false
}

fs.watch(environment.WATCH_DIR_PATH, (event, file) => {
  if (event == 'rename' && !shouldIgnoreFile(file) && fs.existsSync(`${environment.WATCH_DIR_PATH}/${file}`)) {
    try {
      exec(`bash "${environment.NOTIF_SCRIPT_PATH}" "${environment.WATCH_DIR_PATH}" ${environment.NOTIF_SCRIPT_ARGS || ''}`, true)
    } catch (e) {
      log(e, true)
    }
  }
})

const moveDropoff = (srcDir, dstDir) => {
  fs.readdirSync(srcDir).forEach(file => {
    if (!shouldIgnoreFile(file)) {
      const src = `${srcDir}/${file}`
      const dst = `${dstDir}/${file}`
      fs.cpSync(src, dst, { preserveTimestamps: true })
      fs.unlinkSync(src)
      log(`Moved '${src}' to '${dst}'`)
    }
  })
}

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }))
app.post('/handleDropoff', (req, res) => {
  let mountDir = null
  let intermediateDir = null
  try {
    if (!req.body.password) {
      throw 'No password provided'
    }
    // Mount the container
    mountDir = fs.mkdtempSync('/tmp/enc-mnt-')
    exec(`veracrypt -t --non-interactive -p '${req.body.password}' '${environment.VC_CONTAINER_PATH}' '${mountDir}'`)
    // Move dropoff files to an intermediate dir and run the post-process script on them
    intermediateDir = fs.mkdtempSync('/tmp/enc-tmp-')
    moveDropoff(environment.WATCH_DIR_PATH, intermediateDir)
    exec(`bash "${environment.POSTPROCESS_SCRIPT_PATH}" "${intermediateDir}" ${environment.POSTPROCESS_SCRIPT_ARGS || ''}`, true)
    // Move them to the mounted container dir
    moveDropoff(intermediateDir, mountDir)
    res.send()
  } catch (err) {
    log(`Failed process attempt`)
    log(err.toString().split(req.body.password).join(req.body.password ? '****' : ''))
    res.status(400).send()
  } finally {
    try {
      exec(`veracrypt -t -d '${environment.VC_CONTAINER_PATH}' 2>/dev/null 1>&2`)
      if (mountDir) {
        fs.unlinkSync(mountDir)
      }
      if (intermediateDir) {
        if (fs.readdirSync(intermediateDir).length == 0) {
          fs.unlinkSync(intermediateDir)
        } else {
          log(`Intermediate dir is not empty: ${intermediateDir}`, true)
        }
      }
    } catch {
      // ignore
    }
  }
})
app.all('*', (req, res) => {
  res.redirect(404, '/')
})

app.listen(environment.PORT_NUM, () => {
  log(`Server started on port ${environment.PORT_NUM}`)
})