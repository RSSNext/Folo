/**
 * Overlay keys let readers look up the local intent that pending transactions
 * hold for a resource, so a server snapshot can be rebased instead of clobbering it.
 */
const ENTRY_READ_NAMESPACE = "entry-read"
const COLLECTION_NAMESPACE = "collection"
const SUBSCRIPTION_NAMESPACE = "subscription"

export const entryReadOverlayKey = (entryId: string) => `${ENTRY_READ_NAMESPACE}:${entryId}`

export const collectionOverlayKey = (entryId: string) => `${COLLECTION_NAMESPACE}:${entryId}`

/** Keyed by the feed id or list id, which is also the model id of its change-log rows. */
export const subscriptionOverlayKey = (id: string) => `${SUBSCRIPTION_NAMESPACE}:${id}`

export const parseOverlayKey = (key: string): { namespace: string; id: string } | null => {
  const separatorIndex = key.indexOf(":")
  if (separatorIndex <= 0) return null
  return {
    namespace: key.slice(0, separatorIndex),
    id: key.slice(separatorIndex + 1),
  }
}

export const isEntryReadOverlayKey = (key: string) =>
  parseOverlayKey(key)?.namespace === ENTRY_READ_NAMESPACE

export const isCollectionOverlayKey = (key: string) =>
  parseOverlayKey(key)?.namespace === COLLECTION_NAMESPACE

export const isSubscriptionOverlayKey = (key: string) =>
  parseOverlayKey(key)?.namespace === SUBSCRIPTION_NAMESPACE
