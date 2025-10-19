/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "round_questions_collection",
    "name": "round_questions",
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
        "id": "relation_field_round_id",
        "name": "round_id",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "maxSelect": 1,
        "collectionId": "rounds_collection"
      },
      {
        "id": "relation_field_question_id",
        "name": "question_id",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "maxSelect": 1,
        "collectionId": "questions_collection"
      },
      {
        "id": "number_field_question_number",
        "name": "question_number",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "min": 1,
        "max": 20
      },
      {
        "id": "number_field_time_limit",
        "name": "time_limit",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "system": false,
        "min": 5,
        "max": 300
      },
      {
        "id": "number_field_points_possible",
        "name": "points_possible",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "min": 1,
        "default": 10
      },
      {
        "id": "number_field_speed_bonus_possible",
        "name": "speed_bonus_possible",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "min": 0,
        "default": 5
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
          "pending",
          "active",
          "answered",
          "expired"
        ],
        "default": "pending"
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
        "id": "date_field_answered_at",
        "name": "answered_at",
        "type": "date",
        "required": false,
        "presentable": false,
        "unique": false,
        "system": false
      }
    ],
    "indexes": [
      "CREATE INDEX idx_round_questions_round_id ON round_questions (round_id)",
      "CREATE INDEX idx_round_questions_status ON round_questions (status)"
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
  const collection = app.findCollectionByNameOrId("round_questions_collection");
  return app.delete(collection);
});