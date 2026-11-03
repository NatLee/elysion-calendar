#!/bin/bash
# Production mode: nginx in front of the built frontend and the backend.
set -e
cd "$(dirname "$0")"

echo "Starting Elysion Calendar in production mode..."
echo "  App: http://localhost:3000"
echo "Press Ctrl+C to stop."

docker compose up --build
