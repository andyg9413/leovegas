#!/bin/sh

set -e

host="$1"
port="$2"

until mysql -h "$host" -P "$port" -u "$DB_USERNAME" -p"$DB_PASSWORD" -e 'SELECT 1'; do
  >&2 echo "MySQL is unavailable - sleeping"
  sleep 1
done

>&2 echo "MySQL is up - executing command"
npm run migration:run && npm run start:prod