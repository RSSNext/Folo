import { FollowTimeoutError } from "@follow-app/client-sdk"

/**
 * expo/fetch rejects with "fetch failed: <native reason>" when no response came back, e.g.
 * "java.net.ConnectException: Failed to connect to …". A request the app cancelled says
 * "aborted" instead.
 */
export const isConnectionFailure = (error: unknown): boolean =>
  error instanceof Error &&
  error.message.startsWith("fetch failed:") &&
  !error.message.includes("aborted")

/**
 * Whether a request got no answer at all, as offline, with the API down or when it timed out. It
 * may well work once the connection is back, unlike a request the server answered with an error.
 */
export const isUnansweredRequestError = (error: unknown) =>
  error instanceof FollowTimeoutError || isConnectionFailure(error)
