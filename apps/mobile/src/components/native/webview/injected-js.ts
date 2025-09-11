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
