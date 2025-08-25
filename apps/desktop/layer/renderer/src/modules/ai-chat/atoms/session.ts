import { getStorageNS } from "@follow/utils/ns"
import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

import { createAtomHooks } from "~/lib/jotai"

// Edit state management for messages
export const [, , useEditingMessageId, useSetEditingMessageId, , setEditingMessageId] =
  createAtomHooks(atom<string | null>(null))

// AI Model persistence
interface AIModelState {
  selectedModel: string | null
}

const aiModelInitialState: AIModelState = {
  selectedModel: null,
}

export const [, , useAIModelState, useSetAIModelState, getAIModelState, setAIModelState] =
  createAtomHooks<AIModelState>(
    atomWithStorage(getStorageNS("ai-chat-model"), aiModelInitialState, undefined, {
      getOnInit: true,
    }),
  )
