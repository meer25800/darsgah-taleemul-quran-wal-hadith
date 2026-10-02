#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/darsgahkongamdara"

cd "$APP_DIR/backend"
npm ci --omit=dev
npm run migrate:institute

cd "$APP_DIR/frontend-next"
npm ci
npm run typecheck
npm run test
npm run build

cd "$APP_DIR"
pm2 startOrReload deploy/ecosystem.config.cjs --env production
pm2 save

curl --fail --silent --show-error http://127.0.0.1:5000/health
curl --fail --silent --show-error http://127.0.0.1:3000/ >/dev/null

echo "Darsgah deployment completed successfully."
