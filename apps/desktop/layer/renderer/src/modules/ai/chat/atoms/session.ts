import { atom } from "jotai"

import { createAtomHooks } from "~/lib/jotai"

// Edit state management for messages
export const [, , useEditingMessageId, useSetEditingMessageId, , setEditingMessageId] =
  createAtomHooks(atom<string | null>(null))
