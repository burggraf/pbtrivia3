/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "games_collection",
    "name": "games",
    "type": "base",
    "system": false,
    "fields": [
      {
        "id": "text_field_id",
        "name": "id",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": true,
        "hidden": false,
        "primaryKey": true,
        "autogeneratePattern": "[a-z0-9]{15}",
        "min": 15,
        "max": 15,
        "pattern": "^[a-z0-9]+$"
      },
      {
        "id": "text_field_name",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "min": 1,
        "max": 100
      },
      {
        "id": "text_field_code",
        "name": "code",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": true,
        "system": false,
        "min": 6,
        "max": 6,
        "pattern": "^[A-Z0-9]{6}$"
      },
      {
        "id": "relation_field_host_id",
        "name": "host_id",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "maxSelect": 1,
        "collectionId": "_pb_users_auth_"
      },
      {
        "id": "select_field_status",
        "name": "status",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "maxSelect": 1,
        "values": [
          "setup",
          "lobby",
          "playing",
          "finished"
        ],
        "default": "setup"
      },
      {
        "id": "number_field_min_team_size",
        "name": "min_team_size",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "min": 1,
        "max": 6,
        "default": 1
      },
      {
        "id": "number_field_max_team_size",
        "name": "max_team_size",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "min": 1,
        "max": 6,
        "default": 6
      },
      {
        "id": "bool_field_time_limit_enabled",
        "name": "time_limit_enabled",
        "type": "bool",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "default": false
      },
      {
        "id": "number_field_time_limit_seconds",
        "name": "time_limit_seconds",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "system": false,
        "min": 10,
        "max": 300
      },
      {
        "id": "bool_field_sound_effects_enabled",
        "name": "sound_effects_enabled",
        "type": "bool",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "default": true
      },
      {
        "id": "number_field_current_round",
        "name": "current_round",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "system": false,
        "min": 1,
        "default": 1
      },
      {
        "id": "date_field_started_at",
        "name": "started_at",
        "type": "date",
        "required": false,
        "presentable": false,
        "unique": false,
        "system": false
      },
      {
        "id": "date_field_finished_at",
        "name": "finished_at",
        "type": "date",
        "required": false,
        "presentable": false,
        "unique": false,
        "system": false
      }
    ],
    "indexes": [
      "CREATE INDEX idx_games_code ON games (code)",
      "CREATE INDEX idx_games_host_id ON games (host_id)",
      "CREATE INDEX idx_games_status ON games (status)"
    ],
    "listRule": "@request.auth.id != null && host_id = @request.auth.id",
    "viewRule": "@request.auth.id != null && host_id = @request.auth.id",
    "createRule": "@request.auth.id != null",
    "updateRule": "@request.auth.id != null && host_id = @request.auth.id",
    "deleteRule": "@request.auth.id != null && host_id = @request.auth.id",
    "options": {}
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("games_collection");
  return app.delete(collection);
});