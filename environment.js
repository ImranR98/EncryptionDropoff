// Validates config. environment variables and and exports them as an object 

const dotenv = require('dotenv')
const fs = require('fs')

if (!process.env['DOTENV_INITIALIZED']) {
    dotenv.config()
    process.env['DOTENV_INITIALIZED'] = true
}

const config = { // End with '_PATH', '_DIR_PATH', or '_NUM' for extra validation
    VC_CONTAINER_PATH: '/container.hc', // The VeraCrypt container to move files into
    WATCH_DIR_PATH: '/dropoff', // The directory to watch for new files
    NOTIF_SCRIPT_PATH: __dirname + '/default_notif.sh', // The script to run when there are new files
    POSTPROCESS_SCRIPT_PATH: __dirname + '/default_postprocess.sh', // The script to run before moving files into the container
    NOTIF_SCRIPT_ARGS: '', // Optional extra arguments for the notification script (after WATCH_DIR_PATH)
    POSTPROCESS_SCRIPT_ARGS: '', // Optional extra arguments for the process script (after WATCH_DIR_PATH)
    PORT_NUM: '4321' // HTTP port to listen on
}

for (var key in config) {
    if (!process.env[key] && (config[key] === undefined || config[key] === null)) {
        throw `ERROR: The '${key}' environment variable is not defined!`
    } else if (!!process.env[key]) {
        config[key] = process.env[key]
    }
    if (key.endsWith('_PATH')) {
        if (!fs.existsSync(config[key])) {
            throw `ERROR: The '${key}' file/directory does not exist: ${config[key]}`
        }
        if (key.endsWith('_DIR_PATH')) {
            if (!fs.statSync(config[key]).isDirectory()) {
                throw `ERROR: The '${key}' environment variable is not a directory: ${config[key]}`
            }
        } else {
            if (!fs.statSync(config[key]).isFile()) {
                throw `ERROR: The '${key}' environment variable is not a file: ${config[key]}`
            }
        }
    }
    if (key.endsWith('_NUM')) {
        try {
            if (Number.isNaN(Number.parseFloat(config[key]))) {
                throw null
            }
        } catch (e) {
            throw `ERROR: The '${key}' environment variable is not a number: ${config[key]}`
        }
    }
}

module.exports = config