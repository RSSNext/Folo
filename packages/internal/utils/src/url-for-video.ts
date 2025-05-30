export const transformVideoUrl = ({
  url,
  mini = false,
  isIframe = false,
  attachments,
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
}): string | null => {
  if (url?.match(/\/\/www.bilibili.com\/video\/BV\w+/)) {
    const player = isIframe
      ? "https://player.bilibili.com/player.html"
      : "https://www.bilibili.com/blackboard/newplayer.html"
    return `${player}?${new URLSearchParams({
      isOutside: "true",
      autoplay: "true",
      danmaku: "true",
      muted: mini ? "true" : "false",
      highQuality: "true",
      bvid: url.match(/\/\/www.bilibili.com\/video\/(BV\w+)/)?.[1] || "",
    }).toString()}`
  }

  if (url?.match(/\/\/www.youtube.com\/watch\?v=[-\w]+/)) {
    return `https://www.youtube-nocookie.com/embed/${url.match(/\/\/www.youtube.com\/watch\?v=([-\w]+)/)?.[1]}?${new URLSearchParams(
      {
        controls: mini ? "0" : "1",
        autoplay: "1",
        mute: mini ? "1" : "0",
      },
    ).toString()}`
  }

  if (url?.match(/\/\/www.pornhub.com\/view_video.php\?viewkey=\w+/)) {
    if (mini) {
      return null
    } else {
      return `https://www.pornhub.com/embed/${url.match(/\/\/www.pornhub.com\/view_video.php\?viewkey=(\w+)/)?.[1]}?${new URLSearchParams(
        {
          autoplay: "1",
        },
      ).toString()}`
    }
  }

  if (attachments) {
    return attachments.find((attachment) => attachment.mime_type === "text/html")?.url ?? null
  }
  return null
}
