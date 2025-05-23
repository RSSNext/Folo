import { getStorageNS } from "@follow/utils/ns"

/// Feed
export const FEED_COLLECTION_LIST = "collections"
/// Local storage keys
export const QUERY_PERSIST_KEY = getStorageNS("REACT_QUERY_OFFLINE_CACHE")
export const I18N_LOCALE_KEY = getStorageNS("I18N_LOCALE")

/// Route Keys
export const ROUTE_FEED_PENDING = "all"
export const ROUTE_ENTRY_PENDING = "pending"
export const ROUTE_FEED_IN_FOLDER = "folder-"
export const ROUTE_FEED_IN_LIST = "list-"
export const ROUTE_FEED_IN_INBOX = "inbox-"
export const ROUTE_TIMELINE_OF_VIEW = "view-"

// Inbox subscription's feedId is `inbox-${inboxId}`, we need to convert it between unread and entry store.
export const INBOX_PREFIX_ID = "inbox-"
export const getInboxOrFeedIdFromFeedId = (id: string) =>
  id.startsWith(INBOX_PREFIX_ID) ? id.slice(INBOX_PREFIX_ID.length) : id
export const getInboxIdWithPrefix = (id: string) =>
  id.startsWith(INBOX_PREFIX_ID) ? id : INBOX_PREFIX_ID + id
