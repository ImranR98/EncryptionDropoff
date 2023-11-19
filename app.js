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
  console[isErr ? 'error' : 'log'](`${skips}${formatDate(new Date())}: ${typeof data == 'object' ? JSON.stringify(data) : data.toString()}`)
}

const exec = (command, logStdOut = false, logStdErr = false) => new Promise((resolve, reject) => {
  child_process.exec(`${command}`, (err, stdout, stderr) => {
    stdout = stdout ? stdout.trim() : stdout
    stderr = stderr ? stderr.trim() : stderr
    err = err ? err.toString().trim() : err
    if (stdout && logStdOut) {
      log(stdout)
    }
    if ((err || stderr) && logStdErr) {
      log(err || stderr, true)
    }
    if (err) {
      reject({ error: err })
    }
    resolve(stdout)
  })
})

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

var bundleStarted = false
fs.watch(environment.WATCH_DIR_PATH, (event, file) => {
  if (event == 'rename' && !shouldIgnoreFile(file) && fs.existsSync(`${environment.WATCH_DIR_PATH}/${file}`)) {
    if (!bundleStarted) {
      bundleStarted = true
      setTimeout(() => {
        bundleStarted = false
        try {
          exec(`bash "${environment.NOTIF_SCRIPT_PATH}" "${environment.WATCH_DIR_PATH}" ${environment.NOTIF_SCRIPT_ARGS || ''}`, true, true)
        } catch (e) {
          console.error(e)
          throw e
        }
      }, Number.parseInt(environment.WATCHER_BUNDLE_TIMEOUT_NUM));
    }
  }
})

const getDropoffFiles = (dir) =>
  fs.readdirSync(dir).map(file =>
    shouldIgnoreFile(file) ? null : `${dir}/${file}`
  ).filter(file => !!file)

const moveDropoffFiles = (srcFiles, dstDir, standardizeWhiteSpace, copy) =>
  srcFiles.map(src => {
    const dst = `${dstDir}/${standardizeWhiteSpace ? file.replace(/\s/g, ' ') : file}` // Weird things like non-breaking spaces cause issues
    fs.cpSync(src, dst, { preserveTimestamps: true })
    if (!fs.existsSync(dst)) {
      throw `Could not move file from '${src}' to '${dst}'`
    }
    if (!copy) {
      fs.unlinkSync(src)
    }
    log(`${copy ? 'Copied' : 'Moved'} '${src}' to '${dst}'`)
    return dst
  })

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }))
app.post('/handleDropoff', async (req, res) => {
  let mountDir = null
  let intermediateDir = null
  const dismount = async () => {
    try {
      await exec(`veracrypt -t -d '${environment.VC_CONTAINER_PATH}'`, false, false)
    } catch {
      // ignore
    }
  }
  try {
    if (!req.body.password) {
      throw 'No password provided'
    }
    // Mount the container
    mountDir = fs.mkdtempSync('/tmp/enc-mnt-')
    await exec(`veracrypt -t --non-interactive -p '${req.body.password}' '${environment.VC_CONTAINER_PATH}' '${mountDir}'`)
    // Move dropoff files to an intermediate dir and run the post-process script on them
    intermediateDir = fs.mkdtempSync('/tmp/enc-tmp-')
    const dropoffFiles = getDropoffFiles(environment.WATCH_DIR_PATH)
    const intermediateFiles = moveDropoffFiles(dropoffFiles, intermediateDir, true, true)
    await exec(`bash "${environment.POSTPROCESS_SCRIPT_PATH}" "${intermediateDir}" ${environment.POSTPROCESS_SCRIPT_ARGS || ''}`, true)
    // Move them to the mounted container dir
    moveDropoffFiles(intermediateFiles, mountDir)
    // Dismount and update container mdate
    await dismount()
    const currentTime = new Date()
    fs.utimesSync(environment.VC_CONTAINER_PATH, currentTime, currentTime)
    log('Dropoff Successful.')
    try {
      dropoffFiles.forEach(file => fs.unlinkSync(file))
    } catch (e) {
      //
    }
    res.send()
  } catch (err) {
    const safeError = typeof err == 'string' ? err : undefined
    if (typeof err == 'object') {
      err = JSON.stringify(err)
    }
    log(err.toString().split(req.body.password).join(req.body.password ? '****' : ''))
    res.status(400).send(safeError)
  } finally {
    await dismount()
    if (mountDir) {
      if (fs.readdirSync(mountDir).length == 0) {
        fs.rmdirSync(mountDir)
      } else {
        log(`Mount dir is not empty: ${mountDir}`, true)
      }
    }
    if (intermediateDir) {
      if (fs.readdirSync(intermediateDir).length == 0) {
        fs.rmdirSync(intermediateDir)
      } else {
        log(`Intermediate dir is not empty: ${intermediateDir}`, true)
      }
    }
  }
})
app.all('*', (req, res) => {
  res.redirect(404, '/')
})

app.listen(environment.PORT_NUM, () => {
  log(`Server started on port ${environment.PORT_NUM}`)
})