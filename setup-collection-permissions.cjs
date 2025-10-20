/**
 * Setup PocketBase Collection Permissions
 * This script configures the collection permissions to allow authenticated users
 * to create games, teams, and participate in trivia sessions
 */

const { Pool } = require('pg');

async function setupCollectionPermissions() {
  console.log('Setting up PocketBase collection permissions...');

  try {
    // First, let's check if we have a database connection
    const fs = require('fs');
    const path = require('path');

    const pbDataDir = path.join(__dirname, 'pocketbase', 'pb_data');
    const dbPath = path.join(pbDataDir, 'data.db');

    if (!fs.existsSync(dbPath)) {
      console.error('PocketBase database not found. Please start PocketBase first.');
      process.exit(1);
    }

    console.log('Database found at:', dbPath);

    // For PocketBase, we need to manually update the collection rules
    // Let's create a backup of the current database first
    const backupPath = dbPath + '.backup.' + Date.now();
    fs.copyFileSync(dbPath, backupPath);
    console.log('Database backup created at:', backupPath);

    // Now let's update the collection permissions using SQLite
    const Database = require('better-sqlite3');
    const db = new Database(dbPath);

    console.log('Updating collection permissions...');

    // Games collection - allow authenticated users to create and manage their own games
    db.prepare(`
      UPDATE _collections
      SET list_rule = 'request.auth != null && @collection.host_id = request.auth.id',
          view_rule = 'request.auth != null && @collection.host_id = request.auth.id',
          create_rule = 'request.auth != null',
          update_rule = 'request.auth != null && @collection.host_id = request.auth.id',
          delete_rule = 'request.auth != null && @collection.host_id = request.auth.id'
      WHERE name = 'games'
    `).run();

    // Teams collection - allow authenticated users to manage teams in their games
    db.prepare(`
      UPDATE _collections
      SET list_rule = 'request.auth != null',
          view_rule = 'request.auth != null',
          create_rule = 'request.auth != null',
          update_rule = 'request.auth != null && (@collection.host_id = request.auth.id || @collection.game_id.host_id = request.auth.id)',
          delete_rule = 'request.auth != null && (@collection.host_id = request.auth.id || @collection.game_id.host_id = request.auth.id)'
      WHERE name = 'teams'
    `).run();

    // Team members collection - allow authenticated users to join teams
    db.prepare(`
      UPDATE _collections
      SET list_rule = 'request.auth != null',
          view_rule = 'request.auth != null',
          create_rule = 'request.auth != null',
          update_rule = 'request.auth != null && @collection.user_id = request.auth.id',
          delete_rule = 'request.auth != null && @collection.user_id = request.auth.id'
      WHERE name = 'team_members'
    `).run();

    // Users collection - allow public registration and user self-management
    db.prepare(`
      UPDATE _collections
      SET list_rule = 'id = @request.auth.id',
          view_rule = 'id = @request.auth.id',
          create_rule = '',
          update_rule = 'id = @request.auth.id',
          delete_rule = 'id = @request.auth.id'
      WHERE name = 'users'
    `).run();

    console.log('Collection permissions updated successfully!');

    // Verify the updates
    const gamesCollection = db.prepare('SELECT list_rule, view_rule, create_rule, update_rule, delete_rule FROM _collections WHERE name = "games"').get();
    console.log('Games collection permissions:', gamesCollection);

    db.close();

    console.log('✅ Collection permissions setup complete!');
    console.log('Please restart PocketBase for changes to take effect.');

  } catch (error) {
    console.error('Error setting up permissions:', error);
    process.exit(1);
  }
}

// Check if this script is being run directly
if (require.main === module) {
  setupCollectionPermissions();
}

module.exports = { setupCollectionPermissions };