/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "questions_collection",
    "name": "questions",
    "type": "base",
    "system": false,
    "fields": [
      {
        "id": "text3208210256",
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
        "id": "category_field",
        "name": "category",
        "type": "text",
        "required": true,
        "presentable": false
      },
      {
        "id": "subcategory_field",
        "name": "subcategory",
        "type": "text",
        "required": false,
        "presentable": false
      },
      {
        "id": "difficulty_field",
        "name": "difficulty",
        "type": "select",
        "required": true,
        "presentable": false,
        "maxSelect": 1,
        "values": [
          "easy",
          "medium",
          "hard"
        ]
      },
      {
        "id": "question_field",
        "name": "question",
        "type": "text",
        "required": true,
        "presentable": true
      },
      {
        "id": "a_field",
        "name": "a",
        "type": "text",
        "required": true,
        "presentable": false
      },
      {
        "id": "b_field",
        "name": "b",
        "type": "text",
        "required": true,
        "presentable": false
      },
      {
        "id": "c_field",
        "name": "c",
        "type": "text",
        "required": true,
        "presentable": false
      },
      {
        "id": "d_field",
        "name": "d",
        "type": "text",
        "required": true,
        "presentable": false
      },
      {
        "id": "level_field",
        "name": "level",
        "type": "text",
        "required": false,
        "presentable": false
      },
      {
        "id": "metadata_field",
        "name": "metadata",
        "type": "json",
        "required": false,
        "presentable": false,
        "maxSize": 2000000
      }
    ],
    "indexes": [
      "CREATE INDEX idx_category ON questions (category)",
      "CREATE INDEX idx_difficulty ON questions (difficulty)",
      "CREATE INDEX idx_subcategory ON questions (subcategory)"
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
  const collection = app.findCollectionByNameOrId("questions_collection");
  return app.delete(collection);
});
