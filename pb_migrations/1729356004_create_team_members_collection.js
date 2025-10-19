/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "team_members_collection",
    "name": "team_members",
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
        "id": "relation_field_user_id",
        "name": "user_id",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "maxSelect": 1,
        "collectionId": "_pb_users_auth_"
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
        "id": "bool_field_is_captain",
        "name": "is_captain",
        "type": "bool",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false,
        "default": false
      },
      {
        "id": "date_field_joined_at",
        "name": "joined_at",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "system": false
      }
    ],
    "indexes": [
      "CREATE INDEX idx_team_members_team_id ON team_members (team_id)",
      "CREATE INDEX idx_team_members_user_id ON team_members (user_id)"
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
  const collection = app.findCollectionByNameOrId("team_members_collection");
  return app.delete(collection);
});