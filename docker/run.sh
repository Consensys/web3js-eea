#!/bin/bash -e

NO_LOCK_REQUIRED=true
. ./.env

# Build and run containers and network
echo "${QUICKSTART_VERSION}" >> ${LOCK_FILE}
echo "Starting network..."
docker-compose up -d
echo "Services are up and running ..."