-- Fix PocketBase Collection Permissions
-- This script updates the collection permissions to allow proper access

-- Update games collection - allow authenticated users to create and manage their own games
UPDATE _collections
SET
    listRule = 'request.auth != null && @collection.host_id = request.auth.id',
    viewRule = 'request.auth != null && @collection.host_id = request.auth.id',
    createRule = 'request.auth != null',
    updateRule = 'request.auth != null && @collection.host_id = request.auth.id',
    deleteRule = 'request.auth != null && @collection.host_id = request.auth.id'
WHERE name = 'games';

-- Update teams collection - allow authenticated users to manage teams in games they host or participate in
UPDATE _collections
SET
    listRule = 'request.auth != null',
    viewRule = 'request.auth != null',
    createRule = 'request.auth != null',
    updateRule = 'request.auth != null && (@collection.host_id = request.auth.id || @collection.game_id.host_id = request.auth.id)',
    deleteRule = 'request.auth != null && (@collection.host_id = request.auth.id || @collection.game_id.host_id = request.auth.id)'
WHERE name = 'teams';

-- Update team_members collection - allow authenticated users to join teams and manage their own membership
UPDATE _collections
SET
    listRule = 'request.auth != null',
    viewRule = 'request.auth != null',
    createRule = 'request.auth != null',
    updateRule = 'request.auth != null && @collection.user_id = request.auth.id',
    deleteRule = 'request.auth != null && @collection.user_id = request.auth.id'
WHERE name = 'team_members';

-- Update users collection - allow public registration but users can only manage their own profile
UPDATE _collections
SET
    listRule = 'id = @request.auth.id',
    viewRule = 'id = @request.auth.id',
    createRule = '',
    updateRule = 'id = @request.auth.id',
    deleteRule = 'id = @request.auth.id'
WHERE name = 'users';

-- Show the updated permissions
SELECT name, listRule, createRule FROM _collections WHERE name IN ('games', 'teams', 'team_members', 'users');