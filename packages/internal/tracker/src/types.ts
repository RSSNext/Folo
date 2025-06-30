export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>

export type IdentifyPayload = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  handle?: string | null
}

export type Tracker = (code: number, properties?: Record<string, unknown>) => Promise<any>
