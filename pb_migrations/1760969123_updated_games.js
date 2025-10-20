/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("games_collection")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id != null && (host_id = @request.auth.id || host_id = @request.auth.name)",
    "viewRule": "@request.auth.id != null && (host_id = @request.auth.id || host_id = @request.auth.name)"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("games_collection")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id != null && host_id = @request.auth.id",
    "viewRule": "@request.auth.id != null && host_id = @request.auth.id"
  }, collection)

  return app.save(collection)
})
