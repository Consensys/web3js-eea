#!/bin/bash -e

NO_LOCK_REQUIRED=true
. ./.env

# Make sure we have an up-to-date image
docker pull hyperledger/besu:${BESU_VERSION}

# Build and run containers and network
echo "${QUICKSTART_VERSION}" >> ${LOCK_FILE}
echo "Starting network..."
docker-compose up -d
echo "Services are up and running ..."
