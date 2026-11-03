#!/bin/bash
# Development mode: frontend and backend both reload when you edit the code.
set -e
cd "$(dirname "$0")"

echo "Starting Elysion Calendar in development mode..."
echo "  App:     http://localhost:3000"
echo "  Backend: http://localhost:8000/api/daily-schedule/$(date +%F)"
echo "Press Ctrl+C to stop."

docker compose -f docker-compose.dev.yml up --build
