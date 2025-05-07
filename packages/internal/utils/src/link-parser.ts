import { parseSafeUrl } from "./utils"

const GITHUB_HOST = "github.com"

export type LinkParserOptions = {
  name: string
  validator: (url: URL) => boolean
  icon: string
}

const defineLinkParser = (options: LinkParserOptions) => {
  const define = (url: URL | string) => {
    const safeUrl = typeof url === "string" ? parseSafeUrl(url) : url
    const validate = safeUrl ? options.validator(safeUrl) : false

    return {
      validate,
    }
  }

  define.parserName = options.name
  define.icon = options.icon
  return define
}

export const isYoutubeUrl = defineLinkParser({
  name: "youtube",
  validator: (url) => url.hostname.includes("youtube.com"),
  icon: "i-logos-youtube-icon",
})

export const isGithubUrl = defineLinkParser({
  name: "github",
  validator: (url) => url.hostname === GITHUB_HOST || url.hostname === "github.blog",
  icon: "i-mgc-github-2-cute-fi text-black dark:text-white",
})

export const isTwitterUrl = defineLinkParser({
  name: "twitter",
  validator: (url) => url.hostname === "twitter.com",
  icon: "i-mgc-twitter-cute-fi text-[#55acee]",
})

export const isXUrl = defineLinkParser({
  name: "x",
  validator: (url) => url.hostname === "x.com",
  icon: "i-mgc-social-x-cute-li",
})

export const isV2exUrl = defineLinkParser({
  name: "v2ex",
  validator: (url) => url.hostname.includes("v2ex.com"),
  icon: "i-simple-icons-v2ex text-text",
})

export const isPixivUrl = defineLinkParser({
  name: "pixiv",
  validator: (url) => url.hostname.includes("pixiv.net"),
  icon: "i-simple-icons-pixiv text-[#0096fa]",
})

export const isDockerHubUrl = defineLinkParser({
  name: "dockerhub",
  validator: (url) => url.hostname.includes("hub.docker.com"),
  icon: "i-simple-icons-docker text-[#0db7ed]",
})

export const isAppleSiteUrl = defineLinkParser({
  name: "apple",
  validator: (url) => url.hostname.includes("apple.com"),
  icon: "i-simple-icons-apple text-[#000] dark:text-[#fff] scale-75",
})

export const isGoogleSiteUrl = defineLinkParser({
  name: "google",
  validator: (url) => url.hostname.includes("google.com"),
  icon: "i-logos-google-icon",
})

export const isTelegramUrl = defineLinkParser({
  name: "telegram",
  validator: (url) => url.hostname.includes("t.me"),
  icon: "i-logos-telegram",
})

export const isSpotifyUrl = defineLinkParser({
  name: "spotify",
  validator: (url) => url.hostname.includes("open.spotify.com"),
  icon: "i-logos-spotify-icon",
})

export const isWeiboUrl = defineLinkParser({
  name: "weibo",
  validator: (url) => url.hostname.includes("weibo.com"),
  icon: "i-simple-icons-sinaweibo text-[#e6162d]",
})

export const isBilibiliUrl = defineLinkParser({
  name: "bilibili",
  validator: (url) => url.hostname.includes("bilibili.com"),
  icon: "i-simple-icons-bilibili text-[#00a1d6]",
})

export const isDoubanUrl = defineLinkParser({
  name: "douban",
  validator: (url) => url.hostname.includes("douban.com"),
  icon: "i-simple-icons-douban text-[#007722]",
})
