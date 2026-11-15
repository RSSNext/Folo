export const transformVideoUrl = ({
  url,
  mini = false,
  isIframe = false,
  attachments,
  lang,
  autoPlay = true,
}: {
  url: string
  mini?: boolean
  isIframe?: boolean
  attachments?:
    | {
        url: string
        mime_type?: string
      }[]
    | null
  lang?: string
  autoPlay?: boolean
}): string | null => {
  if (url?.match(/\/\/www.bilibili.com\/video\/BV\w+/)) {
    const player = isIframe
      ? "https://player.bilibili.com/player.html"
      : "https://www.bilibili.com/blackboard/newplayer.html"
    return `${player}?${new URLSearchParams({
      isOutside: "true",
      autoplay: String(autoPlay),
      danmaku: "true",
      muted: mini ? "true" : "false",
      highQuality: "true",
      bvid: url.match(/\/\/www.bilibili.com\/video\/(BV\w+)/)?.[1] || "",
    }).toString()}`
  }

  if (url?.match(/\/\/www.youtube.com\/(watch\?v=|shorts\/)[-\w]+/)) {
    const videoId = url.match(/\/\/www.youtube.com\/(?:watch\?v=|shorts\/)([-\w]+)/)?.[1]
    return `https://www.youtube-nocookie.com/embed/${videoId}?${new URLSearchParams({
      controls: mini ? "0" : "1",
      autoplay: autoPlay ? "1" : "0",
      mute: mini ? "1" : "0",
      hl: lang ?? "en-US",
      cc_lang_pref: lang ?? "en-US",
    }).toString()}`
  }

  if (url?.match(/\/\/www.pornhub.com\/view_video.php\?viewkey=\w+/)) {
    if (mini) {
      return null
    } else {
      return `https://www.pornhub.com/embed/${url.match(/\/\/www.pornhub.com\/view_video.php\?viewkey=(\w+)/)?.[1]}?${new URLSearchParams(
        {
          autoplay: autoPlay ? "1" : "0",
        },
      ).toString()}`
    }
  }

  if (attachments) {
    return attachments.find((attachment) => attachment.mime_type === "text/html")?.url ?? null
  }
  return null
}

// Players that entry bodies embed directly, and the query value that keeps each one paused
const embedPlayers: { host: RegExp; path?: RegExp; autoplayOff: string }[] = [
  // Bilibili starts playing unless autoplay is "false"
  { host: /^player\.bilibili\.com$/, autoplayOff: "false" },
  { host: /^(?:www\.)?bilibili\.com$/, path: /^\/blackboard\//, autoplayOff: "false" },
  { host: /^(?:www\.)?youtube(?:-nocookie)?\.com$/, path: /^\/embed\//, autoplayOff: "0" },
  { host: /^player\.vimeo\.com$/, autoplayOff: "0" },
  { host: /^player\.twitch\.tv$/, autoplayOff: "false" },
  { host: /^(?:www\.)?pornhub\.com$/, path: /^\/embed\//, autoplayOff: "0" },
]

/**
 * Turns autoplay off in the src of a known video player iframe. Other URLs are returned as is.
 */
export const disableEmbedAutoPlay = (src: string): string => {
  let url: URL
  try {
    url = new URL(src.startsWith("//") ? `https:${src}` : src)
  } catch {
    return src
  }

  const player = embedPlayers.find(
    ({ host, path }) => host.test(url.hostname) && (!path || path.test(url.pathname)),
  )
  if (!player) return src

  url.searchParams.set("autoplay", player.autoplayOff)
  return url.toString()
}
