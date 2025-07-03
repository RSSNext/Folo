export interface Hydratable {
  hydrate: () => Promise<void>
}

export interface Resetable {
  reset: () => Promise<void>
}
