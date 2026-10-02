const PROVIDER_READY_RETRY_DELAYS_MS = [25, 50, 100, 200] as const

/** v26 initializes App Check synchronously before the native provider is ready. */
export async function getAppCheckTokenWhenReady<T>(
  getToken: () => Promise<T>,
  wait: (delay: number) => Promise<void> = (delay) =>
    new Promise((resolve) => setTimeout(resolve, delay)),
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await getToken()
    } catch (error) {
      const delay = PROVIDER_READY_RETRY_DELAYS_MS[attempt]
      if (
        delay === undefined ||
        !error ||
        typeof error !== "object" ||
        !("code" in error) ||
        error.code !== "appCheck/provider-not-ready"
      ) {
        throw error
      }
      await wait(delay)
    }
  }
}
