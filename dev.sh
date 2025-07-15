#!/bin/bash

echo "Starting Elysion Calendar in development mode with watch support..."

# Build and start development containers
docker-compose -f docker-compose.dev.yml up --build

echo "Development environment started!"
echo "Frontend: http://localhost:3001"
echo "Backend: http://localhost:8000"
echo "Nginx: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the services" 