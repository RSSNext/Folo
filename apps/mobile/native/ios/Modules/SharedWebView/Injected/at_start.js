//
//  at_start.js
//  Pods
//
//  Created by Innei on 2025/2/6.
//
;(() => {
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
