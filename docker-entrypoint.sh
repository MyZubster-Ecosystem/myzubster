#!/bin/bash
set -e

# MyZubster MongoDB initialization script
# This script runs when the MongoDB container starts for the first time.
# It creates the myzubster database with the required collections.

echo ">>> MyZubster: Initializing MongoDB..."

mongosh <<EOF
use ${MONGO_INITDB_DATABASE:-myzubster}

db.createCollection("messages")
db.createCollection("gardens")
db.createCollection("gardenreadings")
db.createCollection("plants")

// Create indexes for optimal query performance
db.messages.createIndex({ senderId: 1, receiverId: 1 })
db.messages.createIndex({ timestamp: -1 })

db.gardens.createIndex({ location: "2dsphere" })
db.gardens.createIndex({ ownerId: 1 })
db.gardens.createIndex({ city: 1 })

db.gardenreadings.createIndex({ gardenId: 1, receivedAt: -1 })

db.plants.createIndex({ gps: "2dsphere" })
db.plants.createIndex({ species: 1 })
db.plants.createIndex({ status: 1 })

// Create the application user with readWrite on the app database
db.createUser({
  user: "${MONGO_INITDB_ROOT_USERNAME:-myzubster}",
  pwd: "${MONGO_INITDB_ROOT_PASSWORD:-changeme_in_production}",
  roles: [
    { role: "readWrite", db: "${MONGO_INITDB_DATABASE:-myzubster}" }
  ]
})

print(">>> MyZubster: MongoDB initialization complete!")
EOF