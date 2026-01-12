#!/usr/bin/env bash
set -e

export POSTGRES_DATABASE_URL="postgresql://${POSTGRES_USER}:$(python - <<'EOF'
import os, urllib.parse
print(urllib.parse.quote_plus(os.environ["POSTGRES_PASSWORD"]))
EOF
)@${DB_HOST}:5432/${POSTGRES_DB}"

# Optional sanity log (no secrets)
echo "POSTGRES_DATABASE_URL constructed for host=${DB_HOST}, db=${POSTGRES_DB}"

# Hand control to CMD
exec "$@"