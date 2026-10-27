#!/usr/bin/env sh
# Image build without a reachable database (Dokploy and other panels build before any container runs).
# Starts a throwaway Postgres inside the build stage, applies the migrations, adds the genres and
# countries, then runs `next build`. Pages prerendered from this empty database refresh from the real
# one within about a minute of the app starting (cacheLife "minutes").
set -eu

PATH="/usr/libexec/postgresql17:$PATH"
PGDATA=/tmp/build-pg

mkdir -p "$PGDATA" /run/postgresql
chown node:node "$PGDATA" /run/postgresql
su node -s /bin/sh -c "PATH=$PATH initdb -D $PGDATA -U build --auth=trust >/dev/null"
su node -s /bin/sh -c "PATH=$PATH pg_ctl -D $PGDATA -o '-c listen_addresses=127.0.0.1 -p 5432' -w start >/dev/null"

export DATABASE_URL="postgresql://build@127.0.0.1:5432/postgres"
npx prisma migrate deploy
NODE_ENV=production npx prisma db seed
BUILD_STANDALONE=1 npm run build

su node -s /bin/sh -c "PATH=$PATH pg_ctl -D $PGDATA -m fast stop >/dev/null"
rm -rf "$PGDATA"
