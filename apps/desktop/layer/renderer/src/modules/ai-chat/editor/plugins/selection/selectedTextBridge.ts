import type { SelectedTextNodePayload } from "./SelectedTextNode"

type Listener = (payload: SelectedTextNodePayload) => void

const listeners = new Set<Listener>()
let pendingPayload: SelectedTextNodePayload | null = null

export function queueSelectedTextInsertion(payload: SelectedTextNodePayload) {
  pendingPayload = payload
  if (listeners.size === 0) return

  for (const listener of listeners) {
    listener(payload)
  }
  pendingPayload = null
}

export function subscribeSelectedTextInsertion(listener: Listener) {
  listeners.add(listener)

  if (pendingPayload) {
    listener(pendingPayload)
    pendingPayload = null
  }

  return () => {
    listeners.delete(listener)
  }
}
