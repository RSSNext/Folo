import { atom, useAtomValue, useSetAtom } from "jotai"
import { useCallback } from "react"

// Session state atoms
export const currentRoomIdAtom = atom<string | null>(null)
export const currentTitleAtom = atom<string | undefined>()
export const sessionPersistedAtom = atom<boolean>(false)

// Hooks for accessing session state
export const useCurrentRoomId = () => useAtomValue(currentRoomIdAtom)
export const useCurrentTitle = () => useAtomValue(currentTitleAtom)
export const useSessionPersisted = () => useAtomValue(sessionPersistedAtom)

// Hooks for updating session state
export const useSetCurrentRoomId = () => useSetAtom(currentRoomIdAtom)
export const useSetCurrentTitle = () => useSetAtom(currentTitleAtom)
export const useSetSessionPersisted = () => useSetAtom(sessionPersistedAtom)

// Combined hook for all session state
export const useSessionState = () => {
  return {
    currentRoomId: useAtomValue(currentRoomIdAtom),
    currentTitle: useAtomValue(currentTitleAtom),
    sessionPersisted: useAtomValue(sessionPersistedAtom),
  }
}

// Hook for session state setters
export const useSessionSetters = () => {
  const setCurrentRoomId = useSetAtom(currentRoomIdAtom)
  const setCurrentTitle = useSetAtom(currentTitleAtom)
  const setSessionPersisted = useSetAtom(sessionPersistedAtom)

  return useCallback(
    (updates: {
      currentRoomId?: string | null
      currentTitle?: string | undefined
      sessionPersisted?: boolean
    }) => {
      if (updates.currentRoomId !== undefined) setCurrentRoomId(updates.currentRoomId)
      if (updates.currentTitle !== undefined) setCurrentTitle(updates.currentTitle)
      if (updates.sessionPersisted !== undefined) setSessionPersisted(updates.sessionPersisted)
    },
    [setCurrentRoomId, setCurrentTitle, setSessionPersisted],
  )
}
