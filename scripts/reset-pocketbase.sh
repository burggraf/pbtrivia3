#!/bin/bash

# Reset the PocketBase environment

set -e

echo "⚠️  Resetting PocketBase environment..."
echo "   This will delete all data, migrations, public files, and hooks!"
read -p "   Are you sure? (y/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Reset cancelled"
    exit 1
fi

# Stop the server first
echo "🛑 Stopping PocketBase server..."
./stop-pocketbase.sh

# Remove PocketBase directories
echo "🗑️  Removing PocketBase data..."
rm -rf ./pb_data
rm -rf ./pb_migrations
rm -rf ./pb_public
rm -rf ./pb_hooks

echo "✅ PocketBase environment reset complete!"
echo "   Run ./init-pocketbase.sh to set up a fresh environment"
