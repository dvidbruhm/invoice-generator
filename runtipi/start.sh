#!/bin/sh
set -e

PGDATA=/var/lib/postgresql/data

# Runtipi re-applies 0777 permissions to the whole app-data tree on every
# install/update, which makes PostgreSQL abort at startup with
# "data directory ... has invalid permissions". Normalise it on every boot,
# the same way the official postgres image does.
mkdir -p "$PGDATA"
chown -R postgres:postgres "$PGDATA"
chmod 700 "$PGDATA"

# A container stopped without a clean PostgreSQL shutdown (Runtipi sends the
# signal to PID 1, i.e. this script/node, not to the postgres child) leaves a
# stale postmaster.pid behind. In a fresh container that PID can collide with a
# live process, so pg_ctl thinks a server is still running and gives up.
if ! su - postgres -c "pg_isready -q" 2>/dev/null; then
  rm -f "$PGDATA/postmaster.pid"
fi

if [ ! -d "$PGDATA/base" ]; then
  echo "Initializing PostgreSQL..."
  su - postgres -c "initdb -D $PGDATA"
  su - postgres -c "pg_ctl -D $PGDATA -l /var/log/postgresql.log -w start"
  su - postgres -c "createdb invoices"
  su - postgres -c "pg_ctl -D $PGDATA -m fast -w stop"
fi

echo "Starting PostgreSQL..."
su - postgres -c "pg_ctl -D $PGDATA -l /var/log/postgresql.log -w start"

echo "Waiting for PostgreSQL to be ready..."
until su - postgres -c "pg_isready -q"; do
  sleep 1
done

echo "Starting app..."
exec node server/index.js
