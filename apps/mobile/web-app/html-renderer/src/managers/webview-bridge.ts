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
  setCodeTheme = (v: { light: string; dark: string }) => {
    this.store.set(codeThemeLightAtom, v.light)
    this.store.set(codeThemeDarkAtom, v.dark)
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
    // Minimal native->JS dispatch bridge to centralize API surface
    if (!window.__FO_BRIDGE__) {
      const handlers = {
        setEntry: this.setEntry,
        setCodeTheme: this.setCodeTheme,
        setReaderRenderInlineStyle: this.setReaderRenderInlineStyle,
        setNoMedia: this.setNoMedia,
        setRootFontSize: this.setRootFontSize,
      } as const

      const tryParse = (v: any): any => {
        if (typeof v !== "string") return v
        const s = v.trim()
        if (!s) return v
        if ((s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"))) {
          try {
            return JSON.parse(s)
          } catch {
            return v
          }
        }
        if (s === "true") return true
        if (s === "false") return false
        const n = Number(s)
        if (!Number.isNaN(n) && s === String(n)) return n
        return v
      }

      window.__FO_BRIDGE__ = {
        dispatch(type, payload) {
          try {
            // @ts-expect-error
            const fn = handlers[type]
            if (typeof fn === "function") {
              fn(tryParse(payload))
            } else {
              console.warn("[FO_BRIDGE] No handler for", type)
            }
          } catch (e) {
            console.error("[FO_BRIDGE] dispatch error", type, e)
          }
        },
        applyState(state) {
          try {
            if (!state || typeof state !== "object") return
            for (const key of Object.keys(state)) {
              const fn = handlers[key as keyof typeof handlers]
              if (typeof fn === "function") {
                // @ts-expect-error
                fn(tryParse(state[key]))
              }
            }
          } catch (e) {
            console.error("[FO_BRIDGE] applyState error", e)
          }
        },
      }
    }
  }
}

declare global {
  interface Window {
    __FO_BRIDGE__: {
      dispatch: (type: string, payload: string) => void
      applyState: (state: Record<string, any>) => void
    }
  }
}
