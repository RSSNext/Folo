export type IdentifyPayload = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  handle?: string | null
}

export type TrackPayload = {
  eventName: string
  properties?: Record<string, unknown>
}

export interface TrackerAdapter {
  /**
   * Initialize the tracker adapter
   */
  initialize: () => Promise<void> | void

  /**
   * Track an event
   */
  track: (payload: TrackPayload) => Promise<void> | void

  /**
   * Identify a user
   */
  identify: (payload: IdentifyPayload) => Promise<void> | void

  /**
   * Set user properties
   */
  setUserProperties: (properties: Record<string, unknown>) => Promise<void> | void

  /**
   * Clear user data
   */
  clear: () => Promise<void> | void

  /**
   * Get the adapter name
   */
  getName: () => string

  /**
   * Check if the adapter is enabled
   */
  isEnabled: () => boolean

  /**
   * Enable or disable the adapter
   */
  setEnabled: (enabled: boolean) => void
}
