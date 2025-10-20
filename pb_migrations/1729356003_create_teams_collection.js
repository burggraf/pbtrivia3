/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "teams_collection",
    "name": "teams",
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
        "id": "relation_field_game_id",
        "name": "game_id",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "maxSelect": 1,
        "collectionId": "games_collection"
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
        "max": 50
      },
      {
        "id": "number_field_score",
        "name": "score",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "min": 0,
        "default": 0
      },
      {
        "id": "number_field_current_round_score",
        "name": "current_round_score",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "min": 0,
        "default": 0
      },
      {
        "id": "number_field_rank",
        "name": "rank",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "system": false,
        "min": 1
      },
      {
        "id": "text_field_color",
        "name": "color",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "system": false,
        "max": 7
      }
    ],
    "indexes": [
      "CREATE INDEX idx_teams_game_id ON teams (game_id)",
      "CREATE INDEX idx_teams_rank ON teams (rank)"
    ],
    "listRule": "@request.auth.id != null && game_id.host_id = @request.auth.id",
    "viewRule": "@request.auth.id != null && game_id.host_id = @request.auth.id",
    "createRule": "@request.auth.id != null",
    "updateRule": "@request.auth.id != null && game_id.host_id = @request.auth.id",
    "deleteRule": "@request.auth.id != null && game_id.host_id = @request.auth.id",
    "options": {}
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("teams_collection");
  return app.delete(collection);
});