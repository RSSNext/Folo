import type { BrowserWindow } from "electron"
import { useEffect, useRef } from "react"

export const EventsMap = {
  QuickAdd: "quick-add",
  Discover: "discover",
  OpenSearch: "open-search",
}

export const dispatchEventOnWindow = (
  window: BrowserWindow,
  event: keyof typeof EventsMap,
  ...args: any[]
) => {
  window.webContents.executeJavaScript(
    iife(`
   ${function Call(event: string, ...args: any[]) {
     globalThis.window.dispatchEvent(new CustomEvent(event, { detail: args }))
   }}
    Call('${EventsMap[event]}', ${args.map((arg) => JSON.stringify(arg)).join(",")});
  `),
  )
}

const iife = (code: string) => `!(() => {${code}})()`
const subscribeEvent = (event: keyof typeof EventsMap, callback: (args: any) => void) => {
  const handler = (e) => {
    callback(e.detail)
  }
  window.addEventListener(EventsMap[event], handler)

  return () => {
    window.removeEventListener(EventsMap[event], handler)
  }
}

export const useSubscribeElectronEvent = (
  event: keyof typeof EventsMap,
  callback: (args: any) => void,
) => {
  const eventCallbackRef = useRef(callback)
  eventCallbackRef.current = callback

  useEffect(() => {
    const unsubscribe = subscribeEvent(event, eventCallbackRef.current)
    return unsubscribe
  }, [event])
}
