export const dbSchemaV1 = {
  entries: "&id",
  feeds: "&id",
  subscriptions: "&id",
  entryRelated: "&id",
  feedUnreads: "&id",
}

export const dbSchemaV2 = {
  ...dbSchemaV1,
  subscriptions: "&id, userId, feedId",
}

export const dbSchemaV3 = {
  ...dbSchemaV2,
  feedEntries: null,

  subscriptions: "&id, userId, &feedId",
}

export const dbSchemaV4 = {
  ...dbSchemaV3,
  entries: "&id, feedId",
  subscriptions: "&id, userId, feedId",
}

export const dbSchemaV5 = {
  ...dbSchemaV4,
  cleaner: "&refId, visitedAt",
}

export const dbSchemaV6 = {
  ...dbSchemaV5,
  lists: "&id, title",
}

export const dbSchemaV7 = {
  ...dbSchemaV6,
  inboxes: "&id",
}

export const dbSchemaV8 = dbSchemaV7
