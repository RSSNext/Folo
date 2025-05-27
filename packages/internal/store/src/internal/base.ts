import type { FetchEntriesPropsSettings } from "../entry/types"

export interface Hydratable {
  hydrate: (options?: HydrationOptions) => Promise<void>
}

export type HydrationOptions = FetchEntriesPropsSettings
