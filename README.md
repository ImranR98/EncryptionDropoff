# EncryptionDropoff

App to watch a folder for new files, then notify the user and allow them to remotely initiate the moving of those files into an encrypted container.

Configured via environment variables. See `environment.js` for configuration details.

Default script behaviour:
- The default notification script sends a notification to a random [ntfy.sh](https://ntfy.sh) ID that can be overridden with an extra argument.
- The default process script prefixes each file with a `YYYY-MM-DD HHMM - ` timestamp based on it's created or modified date.

NOTE:
- VeraCrypt commands typically require root access.
- Dockerfile is provided for easier packaging and deployment, NOT security as the container MUST have privileged access.
  - Example: `docker run -v ~/Downloads/container.hc:/container.hc -v ~/Downloads/dropoff:/dropoff -e NOTIF_SCRIPT_ARGS='H9F3bxJG6i2Rq7K1' -p 4321:4321 --name encryption-dropoff encryption-dropoff`