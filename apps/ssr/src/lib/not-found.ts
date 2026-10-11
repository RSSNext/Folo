import { FollowAPIError } from "@follow-app/client-sdk"
import { FetchError } from "ofetch"

export class NotFoundError extends Error {
  constructor(reason: string) {
    super(`Page not found: ${reason}`)
  }
}
export const callNotFound = (e: any) => {
  // The API client throws FollowAPIError; FetchError is kept for plain fetches
  if ((e instanceof FollowAPIError || e instanceof FetchError) && e.status === 404) {
    throw new NotFoundError(e.message)
  }
  throw e
}
