#!/bin/bash

envfile=".env"

# Prioritize base dir .env over backend dir .env, as docker-compose should pull from there
if [ -s "../.env" ]; then
   envfile="../.env"
fi

docker build -t llsc_db_dev_local -f Dockerfile.db .
docker run -d \
  --name llsc_db_dev_local \
  --env-file $envfile \
  -p 5432:5432 \
  -v llsc_postgres_data:/var/lib/postgresql/data \
  llsc_db_dev_local
