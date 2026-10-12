const YOUTUBE_EMBED_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "m.youtube.com",
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
])

/** The video id of a YouTube embed URL, or null for anything else (including playlists) */
export const getYouTubeEmbedVideoId = (src: unknown) => {
  if (typeof src !== "string") return null
  let url: URL
  try {
    url = new URL(src, "https://www.youtube.com")
  } catch {
    return null
  }
  if (!YOUTUBE_EMBED_HOSTS.has(url.hostname)) return null
  const videoId = url.pathname.match(/^\/embed\/([\w-]+)\/?$/)?.[1]
  return videoId && videoId !== "videoseries" ? videoId : null
}

/**
 * The article page is a local file, so an embedded YouTube player gets no referrer and refuses
 * to play ("Error 153"). Show the thumbnail and open the video in YouTube instead.
 */
export const YouTubeEmbedCard = ({ videoId, title }: { videoId: string; title?: string }) => (
  <a
    className="relative my-4 block aspect-video w-full overflow-hidden rounded-lg bg-black no-underline"
    href={`https://www.youtube.com/watch?v=${videoId}`}
    target="_blank"
    rel="noreferrer"
    aria-label={title || "YouTube"}
  >
    <img
      className="!m-0 size-full object-cover"
      src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
      alt={title ?? ""}
      loading="lazy"
    />
    <span className="absolute left-1/2 top-1/2 flex h-12 w-[68px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-[#ff0033]">
      <i className="i-mgc-play-cute-fi size-6 text-white" />
    </span>
  </a>
)
