/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "rounds_collection",
    "name": "rounds",
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
        "id": "number_field_round_number",
        "name": "round_number",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "min": 1,
        "max": 20
      },
      {
        "id": "text_field_title",
        "name": "title",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "min": 1,
        "max": 100
      },
      {
        "id": "number_field_num_questions",
        "name": "num_questions",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "min": 1,
        "max": 20,
        "default": 10
      },
      {
        "id": "json_field_categories",
        "name": "categories",
        "type": "json",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "maxSize": 1000
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
          "active",
          "completed"
        ],
        "default": "setup"
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
        "id": "date_field_completed_at",
        "name": "completed_at",
        "type": "date",
        "required": false,
        "presentable": false,
        "unique": false,
        "system": false
      }
    ],
    "indexes": [
      "CREATE INDEX idx_rounds_game_id ON rounds (game_id)",
      "CREATE INDEX idx_rounds_status ON rounds (status)"
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
  const collection = app.findCollectionByNameOrId("rounds_collection");
  return app.delete(collection);
});