#!/usr/bin/env sh
# First deploy and every update. Run from the project folder on the server: sh deploy/deploy.sh
set -eu

COMPOSE="docker compose -f docker-compose.prod.yml"

if [ ! -f .env ]; then
  echo "Missing .env: copy .env.example to .env and fill in the production values first." >&2
  exit 1
fi

echo "1/4 Starting the database..."
$COMPOSE up -d --wait db

echo "2/4 Applying database migrations..."
$COMPOSE run --rm --build migrate

echo "3/4 Building the app (prerenders pages from the database)..."
$COMPOSE build app

echo "4/4 Starting the app, HTTPS proxy and scheduled jobs..."
$COMPOSE up -d --wait app caddy cron

echo "Done. Health check:"
$COMPOSE exec -T app wget -qO- http://127.0.0.1:3000/api/health && echo
