// Inbox subscription's feedId is `inbox-${inboxId}`, we need to convert it between unread and entry store.
export const INBOX_PREFIX_ID = "inbox-"
export const getInboxHandleOrFeedIdFromFeedId = (id: string) =>
  id.startsWith(INBOX_PREFIX_ID) ? id.slice(INBOX_PREFIX_ID.length) : id
export const getInboxFeedIdWithPrefix = (id: string) =>
  id.startsWith(INBOX_PREFIX_ID) ? id : INBOX_PREFIX_ID + id
