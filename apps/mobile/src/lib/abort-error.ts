/**
 * expo/fetch rejects a request it aborted with its own "fetch failed: <native reason>", which
 * reads as a lost connection. The SDK aborts a request that takes longer than its timeout and
 * reports a timeout only for the standard AbortError, so an aborted request rejects with that.
 */
export const reportAbortsAsAbortError =
  <TInit extends { signal?: AbortSignal | null }, TResponse>(
    fetchImpl: (input: string, init?: TInit) => Promise<TResponse>,
  ) =>
  async (input: string, init?: TInit): Promise<TResponse> => {
    try {
      return await fetchImpl(input, init)
    } catch (error) {
      if (init?.signal?.aborted) {
        throw new DOMException("The operation was aborted.", "AbortError")
      }
      throw error
    }
  }
