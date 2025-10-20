/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "used_questions_collection",
    "name": "used_questions",
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
        "id": "date_field_used_at",
        "name": "used_at",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false
      }
    ],
    "indexes": [
      "CREATE INDEX idx_used_questions_host_id ON used_questions (host_id)",
      "CREATE INDEX idx_used_questions_question_id ON used_questions (question_id)",
      "CREATE INDEX idx_used_questions_used_at ON used_questions (used_at)"
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
  const collection = app.findCollectionByNameOrId("used_questions_collection");
  return app.delete(collection);
});