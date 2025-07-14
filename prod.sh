#!/bin/bash

echo "Starting Elysion Calendar in production mode..."

# Build and start production containers
docker-compose up --build

echo "Production environment started!"
echo "Application: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the services" 