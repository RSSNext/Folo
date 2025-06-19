import { FetchError } from "ofetch"

export class NotFoundError extends Error {
  constructor(reason: string) {
    super(`Page not found: ${reason}`)
  }
}
export const callNotFound = (e: any) => {
  if (e instanceof FetchError && e.status === 404) {
    throw new NotFoundError(e.message)
  }
  throw e
}
