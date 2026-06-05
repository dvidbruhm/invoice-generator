#!/bin/sh
set -e

if [ ! -d "/var/lib/postgresql/data/base" ]; then
  echo "Initializing PostgreSQL..."
  mkdir -p /var/lib/postgresql/data
  chown -R postgres:postgres /var/lib/postgresql/data
  su - postgres -c "initdb -D /var/lib/postgresql/data"
  su - postgres -c "pg_ctl -D /var/lib/postgresql/data -l /var/log/postgresql.log -w start"
  su - postgres -c "createdb invoices"
  su - postgres -c "pg_ctl -D /var/lib/postgresql/data -m fast -w stop"
fi

echo "Starting PostgreSQL..."
su - postgres -c "pg_ctl -D /var/lib/postgresql/data -l /var/log/postgresql.log -w start"

echo "Waiting for PostgreSQL to be ready..."
until su - postgres -c "pg_isready -q"; do
  sleep 1
done

echo "Starting app..."
exec node server/index.js
