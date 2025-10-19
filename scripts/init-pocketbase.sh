#!/bin/bash

# Initialize PocketBase environment for local testing

set -e

echo "🚀 Initializing PocketBase environment..."

# Create admin user
echo "👤 Creating admin user..."
./pocketbase superuser upsert admin@example.com Password123

# Run migrations
echo "📦 Running migrations..."
./pocketbase migrate

# Start the PocketBase server in the background
echo "🌐 Starting PocketBase server on http://0.0.0.0:8090..."
./pocketbase serve --dev --http 0.0.0.0:8090 &

# Save the PID
PB_PID=$!
echo $PB_PID > .pocketbase.pid

# Wait a moment for the server to start
sleep 2

# Load questions data
echo "📦 Loading questions data..."
node load-questions.js

echo ""
echo "✅ PocketBase initialized successfully!"
echo "   - Server running on http://0.0.0.0:8090"
echo "   - Admin: admin@example.com / Password123"
echo "   - PID: $PB_PID"
echo ""
echo "To stop the server, run: ./stop-pocketbase.sh"
