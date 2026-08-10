# Zemlevlasnyk deploy

## Fast update from PC

Run this in the project folder on Windows:

```bat
update-site.bat "Short description of changes"
```

The script commits local changes, pushes them to GitHub, connects to the VDS, pulls the newest code, installs dependencies, checks `server.js`, restarts PM2, and reloads Nginx.

## Server-only update

Run this on the VDS:

```bash
cd /var/www/Zemlevlasnyk
bash deploy-server.sh
```

## Production URL

```text
https://zemlevlasnyk.com
```
