import type { EntryModel } from "../../types"
import {
  codeThemeDarkAtom,
  codeThemeLightAtom,
  entryAtom,
  noMediaAtom,
  readerRenderInlineStyleAtom,
} from "../atoms"

type Store = ReturnType<typeof import("jotai").createStore>

/**
 * WebView Bridge Manager
 * Handles all JavaScript bridge functions exposed to the native WebView
 */
export class WebViewBridgeManager {
  private store: Store

  constructor(store: Store) {
    this.store = store
  }

  /**
   * Set the current entry to be rendered
   */
  setEntry = (entry: EntryModel) => {
    this.store.set(entryAtom, entry)
    bridge.measure()
  }

  /**
   * Set code highlighting themes for light and dark modes
   */
  setCodeTheme = (light: string, dark: string) => {
    this.store.set(codeThemeLightAtom, light)
    this.store.set(codeThemeDarkAtom, dark)
  }

  /**
   * Set reader render inline style preference
   */
  setReaderRenderInlineStyle = (value: boolean) => {
    this.store.set(readerRenderInlineStyleAtom, value)
  }

  /**
   * Toggle media display
   */
  setNoMedia = (value: boolean) => {
    this.store.set(noMediaAtom, value)
  }

  /**
   * Set root font size for the WebView
   */
  setRootFontSize = (size = 16) => {
    document.documentElement.style.fontSize = `${size}px`
  }

  /**
   * Reset the WebView state
   */
  reset = () => {
    this.store.set(entryAtom, null)
    bridge.measure()
  }

  /**
   * Expose all methods to the global window object
   * This maintains backward compatibility with existing native code
   */
  exposeToWindow() {
    Object.assign(window, {
      setEntry: this.setEntry,
      setCodeTheme: this.setCodeTheme,
      setReaderRenderInlineStyle: this.setReaderRenderInlineStyle,
      setNoMedia: this.setNoMedia,
      setRootFontSize: this.setRootFontSize,
      reset: this.reset,
    })
  }
}
