import { getStorageNS } from "@follow/utils/ns"

import { kv } from "./kv"

const CLIENT_ID_KEY = getStorageNS("client_id")
const SESSION_ID_KEY = getStorageNS("session_id")

const uuid = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replaceAll(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
// In-memory cache for session data
const sessionCache: Record<string, string> = {}

export const getClientId = (): string => {
  const clientId = kv.getSync(CLIENT_ID_KEY)
  if (!clientId) {
    const newClientId = uuid()
    kv.setSync(CLIENT_ID_KEY, newClientId)
    return newClientId
  }
  return clientId
}

export const getSessionId = (): string => {
  // First check in-memory cache
  if (sessionCache[SESSION_ID_KEY]) {
    return sessionCache[SESSION_ID_KEY]
  }

  // Check persistent storage
  const sessionId = kv.getSync(SESSION_ID_KEY)
  if (!sessionId) {
    const newSessionId = uuid()
    // Store in both cache and persistent storage
    sessionCache[SESSION_ID_KEY] = newSessionId
    kv.setSync(SESSION_ID_KEY, newSessionId)
    return newSessionId
  }

  // Store in cache for future access
  sessionCache[SESSION_ID_KEY] = sessionId
  return sessionId
}

export const clearSessionId = (): void => {
  // Clear from both cache and persistent storage
  delete sessionCache[SESSION_ID_KEY]
  kv.delete(SESSION_ID_KEY)
}

export const clearClientId = (): void => {
  kv.delete(CLIENT_ID_KEY)
}
