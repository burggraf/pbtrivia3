#!/bin/bash

# Stop the PocketBase server

set -e

echo "🛑 Stopping PocketBase server..."
pkill -f "pocketbase serve" || echo "   No pocketbase processes found"
