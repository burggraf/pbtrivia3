#!/bin/bash

# Stop the PocketBase server

set -e

echo "🛑 Stopping PocketBase server..."

# Check if PID file exists
if [ -f .pocketbase.pid ]; then
    PB_PID=$(cat .pocketbase.pid)

    # Check if process is still running
    if ps -p $PB_PID > /dev/null 2>&1; then
        echo "   Killing process $PB_PID..."
        kill $PB_PID
        sleep 1

        # Force kill if still running
        if ps -p $PB_PID > /dev/null 2>&1; then
            echo "   Force killing process $PB_PID..."
            kill -9 $PB_PID
        fi
    else
        echo "   Process $PB_PID not running"
    fi

    rm .pocketbase.pid
    echo "✅ PocketBase server stopped"
else
    # Try to find and kill any pocketbase processes
    echo "   No PID file found. Looking for pocketbase processes..."
    pkill -f "pocketbase serve" || echo "   No pocketbase processes found"
fi
