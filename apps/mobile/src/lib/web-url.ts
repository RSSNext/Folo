/**
 * Whether the in-app browser can show `url`. It opens http(s) pages only: on iOS any other URL
 * ends the app. Links such as mailto: and tel: belong to the apps that handle them.
 */
export const isWebUrl = (url: string) => {
  try {
    const { protocol } = new URL(url)
    return protocol === "http:" || protocol === "https:"
  } catch {
    // A relative link has no scheme, and nothing can open it as it is
    return false
  }
}
