/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "answers_collection",
    "name": "answers",
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
        "id": "relation_field_round_question_id",
        "name": "round_question_id",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "maxSelect": 1,
        "collectionId": "round_questions_collection"
      },
      {
        "id": "relation_field_team_id",
        "name": "team_id",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "maxSelect": 1,
        "collectionId": "teams_collection"
      },
      {
        "id": "text_field_answer",
        "name": "answer",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "min": 1,
        "max": 100
      },
      {
        "id": "bool_field_is_correct",
        "name": "is_correct",
        "type": "bool",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false
      },
      {
        "id": "number_field_points_earned",
        "name": "points_earned",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "min": 0,
        "default": 0
      },
      {
        "id": "number_field_speed_bonus_earned",
        "name": "speed_bonus_earned",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "min": 0,
        "default": 0
      },
      {
        "id": "number_field_response_time_ms",
        "name": "response_time_ms",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "system": false,
        "min": 0
      },
      {
        "id": "date_field_submitted_at",
        "name": "submitted_at",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false
      }
    ],
    "indexes": [
      "CREATE INDEX idx_answers_round_question_id ON answers (round_question_id)",
      "CREATE INDEX idx_answers_team_id ON answers (team_id)",
      "CREATE INDEX idx_answers_submitted_at ON answers (submitted_at)"
    ],
    "listRule": "@request.auth.id != null && round_question_id.round_id.game_id.host_id = @request.auth.id",
    "viewRule": "@request.auth.id != null && round_question_id.round_id.game_id.host_id = @request.auth.id",
    "createRule": "@request.auth.id != null",
    "updateRule": "@request.auth.id != null && round_question_id.round_id.game_id.host_id = @request.auth.id",
    "deleteRule": "@request.auth.id != null && round_question_id.round_id.game_id.host_id = @request.auth.id",
    "options": {}
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("answers_collection");
  return app.delete(collection);
});