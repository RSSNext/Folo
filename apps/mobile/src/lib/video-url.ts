import { parseSafeUrl, transformVideoUrl } from "@follow/utils"

const isYoutubeWatchUrl = (url: URL) =>
  url.hostname === "www.youtube.com" &&
  ((url.pathname === "/watch" && url.searchParams.has("v")) || url.pathname.startsWith("/shorts/"))

export const resolveVideoUrlForMobileOpen = (url: string) => {
  const parsedUrl = parseSafeUrl(url)

  if (parsedUrl && isYoutubeWatchUrl(parsedUrl)) {
    return url
  }

  return transformVideoUrl({ url }) || url
}
