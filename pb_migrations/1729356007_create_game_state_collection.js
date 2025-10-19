/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "game_state_collection",
    "name": "game_state",
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
        "unique": true,
        "system": false,
        "maxSelect": 1,
        "collectionId": "games_collection"
      },
      {
        "id": "json_field_current_state",
        "name": "current_state",
        "type": "json",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "maxSize": 5000
      },
      {
        "id": "date_field_last_updated",
        "name": "last_updated",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false
      }
    ],
    "indexes": [
      "CREATE INDEX idx_game_state_game_id ON game_state (game_id)"
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("game_state_collection");
  return app.delete(collection);
});