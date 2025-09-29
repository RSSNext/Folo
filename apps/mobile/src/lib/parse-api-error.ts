// Deprecated: replaced by FollowClient in lib/api-client
import { FetchError } from "ofetch"

export const getBizFetchErrorMessage = (error: Error) => {
  if (error instanceof FetchError && error.response) {
    try {
      const data = JSON.parse(error.response._data)

      if (data.message && data.code) {
        // TODO i18n handle by code
        return data.message
      }
    } catch {
      return error.message
    }
  }
  return error.message
}
