import { injectJavaScript } from "./native-webview.android"

export const SharedWebViewModule = {
  load: () => {
    console.warn("SharedWebViewModule.load is not implemented on Android")
  },
  evaluateJavaScript: (js: string) => {
    injectJavaScript(js)
  },
  dispatch: (type: string, payload?: string) => {
    const payloadExpr = payload != null ? `JSON.parse(${JSON.stringify(payload)})` : "null"
    const js = `;(function(){try{if(window.__FO_BRIDGE__&&typeof window.__FO_BRIDGE__.dispatch==='function'){window.__FO_BRIDGE__.dispatch(${JSON.stringify(
      type,
    )}, ${payloadExpr});}}catch(e){}})();`
    injectJavaScript(js)
  },
}

export const prepareEntryRenderWebView = () => {}
