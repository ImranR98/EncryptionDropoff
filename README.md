# EncryptionDropoff

App to watch a folder for new files, then notify the user and allow them to remotely initiate the moving of those files into an encrypted container.

Configured via environment variables. See `environment.js` for configuration details.

Default script behaviour:
- The default notification script sends a notification to a random [ntfy.sh](https://ntfy.sh) ID that can be overridden with an extra argument.
- The default process script prefixes each file with a `YYYY-MM-DD HHMM - ` timestamp based on it's created or modified date.