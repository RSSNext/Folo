import { getImageProxyUrl } from "../../../lib/img-proxy"

// Survives `encodeURIComponent` unchanged, so it can be located in the generated proxy URL
const IMAGE_URL_PLACEHOLDER = "__FO_IMAGE_URL__"
const [imageProxyUrlPrefix = "", imageProxyUrlSuffix = ""] = getImageProxyUrl({
  url: IMAGE_URL_PLACEHOLDER,
}).split(IMAGE_URL_PLACEHOLDER)

/**
 * The Android entry WebView renders from `file:///android_asset`, so its image requests carry no
 * `Referer`. Hotlink-protected CDNs (e.g. sinaimg.cn, cdnfile.sspai.com) reject such requests, and
 * some image hosts are unreachable from the device network, while the entry list loads the same
 * images through the image proxy. When a content image fails to load, retry it once through that
 * proxy. A failed proxy request is never retried, so this cannot loop.
 */
export const imageProxyFallback = `
;(() => {
  const proxyPrefix = ${JSON.stringify(imageProxyUrlPrefix)}
  const proxySuffix = ${JSON.stringify(imageProxyUrlSuffix)}

  window.addEventListener(
    "error",
    (event) => {
      const image = event.target
      if (!image || image.tagName !== "IMG") return

      const src = (image.getAttribute("src") || "").trim()
      if (!src || src.startsWith(proxyPrefix)) return

      const url = src.startsWith("//") ? "https:" + src : src
      const scheme = url.slice(0, 8).toLowerCase()
      if (!scheme.startsWith("http://") && !scheme.startsWith("https://")) return

      image.setAttribute("src", proxyPrefix + encodeURIComponent(url) + proxySuffix)
    },
    // Resource load errors do not bubble, so they can only be observed in the capture phase
    true,
  )
})()
`

// Ported from apps/mobile/native/ios/Modules/SharedWebView/Injected/at_start.js

const RNMessageHandlers = `
if(!window.webkit) {
  window.webkit = {
    messageHandlers: {
      message: ReactNativeWebView
    },
  }
}
`

export const atStart = `
;(() => {
  ${RNMessageHandlers}
  window.__RN__ = true

  function send(data) {
    window.webkit.messageHandlers.message.postMessage?.(JSON.stringify(data))
  }

  window.bridge = {
    measure: () => {
      send({
        type: "measure",
      })
    },
    setContentHeight: (height) => {
      send({
        type: "setContentHeight",
        payload: height,
      })
    },
    previewImage: (data) => {
      send({
        type: "previewImage",
        payload: {
          imageUrls: data.imageUrls,
          index: data.index || 0,
        },
      })
    },
    seekAudio: (time) => {
      send({
        type: "audio:seekTo",
        payload: {
          time,
        },
      })
    },
  }

  // Signal readiness once DOM is interactive/loaded (guard to send once)
  if (!window.__FO_WEBVIEW_READY__) {
    let sent = false
    const sendReady = () => {
      if (sent) return
      sent = true
      window.__FO_WEBVIEW_READY__ = true
      try {
        send({ type: "ready" })
      } catch {
        /* empty */
      }
    }
    document.addEventListener("DOMContentLoaded", sendReady)
    window.addEventListener("load", sendReady)
  }
})()
${imageProxyFallback}
`

export const atEnd = `
;(() => {
  const root = document.querySelector("#root")
  let ticking = false
  const handleHeight = () => {
    if (ticking) return
    ticking = true
    setTimeout(() => {
      try {
        window.webkit.messageHandlers.message.postMessage(
          JSON.stringify({
            type: "setContentHeight",
            payload: root?.scrollHeight || document.documentElement.scrollHeight,
          }),
        )
      } finally {
        ticking = false
      }
    }, 16)
  }
  window.addEventListener("load", handleHeight)
  const observer = new ResizeObserver(handleHeight)

  setTimeout(() => {
    handleHeight()
  }, 1000)
  observer.observe(root)

  // Fallback: ensure readiness is signaled at end if not yet sent
  if (!window.__FO_WEBVIEW_READY__) {
    try {
      window.__FO_WEBVIEW_READY__ = true
      window.webkit.messageHandlers.message.postMessage(JSON.stringify({ type: "ready" }))
    } catch {
      /* empty */
    }
  }
})()
`
