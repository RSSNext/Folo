// Ported from apps/mobile/native/ios/Modules/SharedWebView/Injected/at_start.js

export const atStart = `
;(() => {
  window.__RN__ = true


  function send(data) {
    window.ReactNativeWebView.postMessage?.(JSON.stringify(data))
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
    }
  }
})()
`

export const atEnd = `

;(() => {
  const root = document.querySelector("#root")
  const handleHeight = () => {
    window.ReactNativeWebView.postMessage?.(
      JSON.stringify({
        type: "setContentHeight",
        payload: root.scrollHeight,
      }),
    )
  }
  window.addEventListener("load", handleHeight)
  const observer = new ResizeObserver(handleHeight)

  setTimeout(() => {
    handleHeight()
  }, 1000)
  observer.observe(root)
})()
`
