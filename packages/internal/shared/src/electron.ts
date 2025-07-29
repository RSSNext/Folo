import { DEEPLINK_SCHEME } from "./constants"

const ELECTRON_QUERY_KEY = "__electron"
export interface OpenElectronWindowOptions {
  resizable?: boolean
  height?: number
  width?: number
}

/**
 * Work electron and browser,
 * if in electron, open a new window, otherwise open a new tab
 */
export const openElectronWindow = (url: string, options: OpenElectronWindowOptions = {}) => {
  if ("electron" in window) {
    const urlObject = new URL(url)
    const { searchParams } = urlObject

    searchParams.set(ELECTRON_QUERY_KEY, encodeURIComponent(JSON.stringify(options)))

    window.open(urlObject.toString())
  } else {
    // eslint-disable-next-line no-restricted-globals
    window.open(url.replace(DEEPLINK_SCHEME, `${location.origin}/`))
  }
}

export const extractElectronWindowOptions = (url: string): OpenElectronWindowOptions => {
  try {
    const urlObject = new URL(url)
    const { searchParams } = urlObject
    const options = searchParams.get(ELECTRON_QUERY_KEY)
    if (options) {
      return JSON.parse(decodeURIComponent(options))
    }
  } catch (e) {
    console.error(e)
  }
  return {}
}
