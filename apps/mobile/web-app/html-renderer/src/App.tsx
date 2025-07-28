import { createStore, Provider, useAtomValue } from "jotai"

import { entryAtom, noMediaAtom, readerRenderInlineStyleAtom } from "./atoms"
import { HTML } from "./HTML"
import { WebViewBridgeManager } from "./managers/webview-bridge"

const store = createStore()

// Initialize and expose WebView bridge functions
const bridgeManager = new WebViewBridgeManager(store)
bridgeManager.exposeToWindow()

export const App = () => {
  const entry = useAtomValue(entryAtom, { store })
  const readerRenderInlineStyle = useAtomValue(readerRenderInlineStyleAtom, { store })
  const noMedia = useAtomValue(noMediaAtom, { store })

  return (
    <Provider store={store}>
      <HTML renderInlineStyle={readerRenderInlineStyle} noMedia={noMedia}>
        {entry?.content}
      </HTML>
    </Provider>
  )
}
