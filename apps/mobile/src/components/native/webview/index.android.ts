export const SharedWebViewModule = {
  load: () => {
    console.warn("SharedWebViewModule.load is not implemented on Android")
  },
  evaluateJavaScript: () => {
    console.warn("SharedWebViewModule.evaluateJavaScript is not implemented on Android")
  },
}

export const prepareEntryRenderWebView = () => {}
