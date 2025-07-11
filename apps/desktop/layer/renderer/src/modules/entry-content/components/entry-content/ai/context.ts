import { createContext, use } from "react"
import type { StoreApi, UseBoundStore } from "zustand"

export interface IEntryAIContext {
  entryId?: Nullable<string>
  selectedText?: Nullable<string>
}

export const EntryAIContext = createContext<UseBoundStore<StoreApi<IEntryAIContext>>>(null!)

export const useEntryAIContextStore = () => {
  return use(EntryAIContext)
}
