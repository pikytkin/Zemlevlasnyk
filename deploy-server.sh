#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/Zemlevlasnyk"
APP_NAME="zemlevlasnyk"

cd "$APP_DIR"

echo "Pulling latest code..."
git pull --ff-only

echo "Installing production dependencies..."
if [ -f package-lock.json ]; then
  NODE_OPTIONS=--dns-result-order=ipv4first npm ci --omit=dev
else
  NODE_OPTIONS=--dns-result-order=ipv4first npm install --omit=dev
fi

echo "Checking server syntax..."
node --check server.js

echo "Restarting app..."
pm2 restart "$APP_NAME" --update-env
pm2 save

echo "Checking Nginx..."
NGINX_SITE="/etc/nginx/sites-available/zemlevlasnyk.com"
if [ -f "$NGINX_SITE" ] && ! grep -q "client_max_body_size" "$NGINX_SITE"; then
  sed -i "/server_name zemlevlasnyk.com/a\\    client_max_body_size 25m;" "$NGINX_SITE"
fi
nginx -t
systemctl reload nginx

echo "Deployment complete."
