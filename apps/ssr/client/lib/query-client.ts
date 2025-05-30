import { QueryClient } from "@tanstack/react-query"
import { FetchError } from "ofetch"

const DO_NOT_RETRY_CODES = new Set([400, 401, 403, 404, 422])
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retryDelay: 1000,
      retry(failureCount, error) {
        console.error(error)
        if (
          error instanceof FetchError &&
          (error.statusCode === undefined || DO_NOT_RETRY_CODES.has(error.statusCode))
        ) {
          return false
        }

        return !!(3 - failureCount)
      },
    },
  },
})
