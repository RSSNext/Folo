import { apiRequest, connectCdp } from "./cdp"
import { appLanguage } from "./desktop"
import type { AppUiLocale } from "./locales"

// Sets the demo account's synced UI and AI language. Builds after 0.5.10 sync
// both from the account, so AI summaries and translations on every device
// follow them. Uses the signed-in desktop app's session over CDP.
export const setAccountLanguage = async (locale: AppUiLocale) => {
  const session = await connectCdp()
  try {
    const res = await apiRequest<{ code: number; message?: string }>(
      session,
      "PATCH",
      "/settings/general",
      { language: appLanguage[locale], actionLanguage: appLanguage[locale] },
    )
    if (res.code !== 0) throw new Error(`Could not set the account language: ${res.message}`)
  } finally {
    session.close()
  }
}
