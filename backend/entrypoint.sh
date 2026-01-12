#!/usr/bin/env bash
set -e

# URL-encode the password to handle special characters
ENCODED_PASSWORD=$(python3 -c "import urllib.parse, os; print(urllib.parse.quote_plus(os.environ['POSTGRES_PASSWORD']))")

# Export the database URL so it's available to the application
export POSTGRES_DATABASE_URL="postgresql://${POSTGRES_USER}:${ENCODED_PASSWORD}@${DB_HOST}:5432/${POSTGRES_DATABASE}"

# Optional sanity log (no secrets)
echo "POSTGRES_DATABASE_URL constructed for host=${DB_HOST}, db=${POSTGRES_DATABASE}"

# Hand control to CMD
exec "$@"