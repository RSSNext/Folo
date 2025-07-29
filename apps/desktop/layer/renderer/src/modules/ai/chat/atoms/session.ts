import { atom } from "jotai"
import { useCallback } from "react"

import { createAtomHooks } from "~/lib/jotai"

// Session state atoms with hooks
export const [, , useCurrentRoomId, useSetCurrentRoomId, , setCurrentRoomId] = createAtomHooks(
  atom<string | null>(null),
)

export const [, , useCurrentTitle, useSetCurrentTitle, , setCurrentTitle] =
  createAtomHooks(atom<string | undefined>())

export const [, , useSessionPersisted, useSetSessionPersisted, , setSessionPersisted] =
  createAtomHooks(atom<boolean>(false))

// Edit state management for messages
export const [, , useEditingMessageId, useSetEditingMessageId, , setEditingMessageId] =
  createAtomHooks(atom<string | null>(null))

// Combined hook for all session state
export const useSessionState = () => {
  return {
    currentRoomId: useCurrentRoomId(),
    currentTitle: useCurrentTitle(),
    sessionPersisted: useSessionPersisted(),
    editingMessageId: useEditingMessageId(),
  }
}

// Hook for session state setters
export const useSessionSetters = () => {
  const setCurrentRoomIdAtom = useSetCurrentRoomId()
  const setCurrentTitleAtom = useSetCurrentTitle()
  const setSessionPersistedAtom = useSetSessionPersisted()

  return useCallback(
    (updates: {
      currentRoomId?: string | null
      currentTitle?: string | undefined
      sessionPersisted?: boolean
    }) => {
      if (updates.currentRoomId !== undefined) setCurrentRoomIdAtom(updates.currentRoomId)
      if (updates.currentTitle !== undefined) setCurrentTitleAtom(updates.currentTitle)
      if (updates.sessionPersisted !== undefined) setSessionPersistedAtom(updates.sessionPersisted)
    },
    [setCurrentRoomIdAtom, setCurrentTitleAtom, setSessionPersistedAtom],
  )
}
