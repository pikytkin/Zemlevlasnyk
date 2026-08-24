# Zemlevlasnyk deploy

## Fast update from PC

Run this in the project folder on Windows:

```bat
update-site.bat "Short description of changes"
```

The script commits local changes, pushes them to GitHub, connects to the VDS, pulls the newest code, installs dependencies, checks `server.js`, restarts PM2, and reloads Nginx.

Deployment uses `git pull`, not an archive. Therefore `.git`, `node_modules`, `.npm-cache`, and local patch folders are not transferred. Before a production restart, set `NODE_ENV=production`, `ADMIN_USERNAME`, and a unique `ADMIN_PASSWORD` of at least 16 characters in the server environment. The server refuses to start in production with an unsafe administrator configuration.

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
