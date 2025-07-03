import { getStorageNS } from "@follow/utils/ns"
import { nanoid } from "nanoid"

const CLIENT_ID_KEY = getStorageNS("client_id")
const SESSION_ID_KEY = getStorageNS("session_id")

export const getClientId = (): string => {
  const clientId = localStorage.getItem(CLIENT_ID_KEY)
  if (!clientId) {
    const newClientId = nanoid()
    localStorage.setItem(CLIENT_ID_KEY, newClientId)
    return newClientId
  }
  return clientId
}

export const getSessionId = (): string => {
  const sessionId = sessionStorage.getItem(SESSION_ID_KEY)
  if (!sessionId) {
    const newSessionId = nanoid()
    sessionStorage.setItem(SESSION_ID_KEY, newSessionId)
    return newSessionId
  }
  return sessionId
}

export const clearSessionId = (): void => {
  sessionStorage.removeItem(SESSION_ID_KEY)
}

export const clearClientId = (): void => {
  localStorage.removeItem(CLIENT_ID_KEY)
}
