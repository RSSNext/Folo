export const IMAGE_PROXY_URL = "https://webp.follow.is"

export const imageRefererMatches = [
  {
    url: /^https:\/\/\w+\.sinaimg\.cn/,
    referer: "https://weibo.com",
  },
  {
    url: /^https:\/\/i\.pximg\.net/,
    referer: "https://www.pixiv.net",
  },
  {
    url: /^https:\/\/cdnfile\.sspai\.com/,
    referer: "https://sspai.com",
  },
  {
    url: /^https:\/\/(?:\w|-)+\.cdninstagram\.com/,
    referer: "https://www.instagram.com",
  },
  {
    url: /^https:\/\/sp1\.piokok\.com/,
    referer: "https://www.piokok.com",
    force: true,
  },
  {
    url: /^https?:\/\/[\w-]+\.xhscdn\.com/,
    referer: "https://www.xiaohongshu.com",
  },
]

const webpCloudPublicServicesMatches = [
  // https://docs.webp.se/public-services/github-avatar/
  {
    url: /^https:\/\/avatars\.githubusercontent\.com\/u\//,
    target: "https://avatars-githubusercontent-webp.webp.se/u/",
  },
]

export const getImageProxyUrl = ({
  url,
  width,
  height,
}: {
  url: string
  width?: number
  height?: number
}) => {
  return `${IMAGE_PROXY_URL}?url=${encodeURIComponent(url)}&width=${width ? Math.round(width) : ""}&height=${height ? Math.round(height) : ""}`
}

export const replaceImgUrlIfNeed = ({ url, inBrowser }: { url?: string; inBrowser?: boolean }) => {
  if (!url) return url

  for (const rule of webpCloudPublicServicesMatches) {
    if (rule.url.test(url)) {
      return url.replace(rule.url, rule.target)
    }
  }

  for (const rule of imageRefererMatches) {
    if ((inBrowser || rule.force) && rule.url.test(url)) {
      return getImageProxyUrl({ url, width: 0, height: 0 })
    }
  }
  return url
}
