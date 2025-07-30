import { atom } from "jotai"

import { createAtomHooks } from "~/lib/jotai"

export const [, , useSessionPersisted, useSetSessionPersisted, , setSessionPersisted] =
  createAtomHooks(atom<boolean>(false))

// Edit state management for messages
export const [, , useEditingMessageId, useSetEditingMessageId, , setEditingMessageId] =
  createAtomHooks(atom<string | null>(null))

// Combined hook for all session state
export const useSessionState = () => {
  return {
    sessionPersisted: useSessionPersisted(),
    editingMessageId: useEditingMessageId(),
  }
}
