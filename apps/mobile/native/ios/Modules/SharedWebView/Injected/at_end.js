//
//  at_end.js
//  Pods
//
//  Created by Innei on 2025/2/6.
//

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
