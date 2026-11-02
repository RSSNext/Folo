import * as Linking from "expo-linking"

import { kv } from "./kv"

/**
 * React Native reports the link that launched the app for the life of its process, so after the
 * app reloads its JS in place, as sign-out and updates do, the link would open again. A run that
 * reloads leaves the link here; the next run skips it once.
 */
const HANDLED_LAUNCH_LINK_KEY = "deep-link:handled-launch-link"

/** Before reloading the JS in place: this run has handled the link that launched the app */
export const rememberHandledLaunchLink = async () => {
  try {
    const url = await Linking.getInitialURL()
    if (url) kv.setSync(HANDLED_LAUNCH_LINK_KEY, url)
  } catch (error) {
    console.warn("[deep-link] could not keep the launch link across the reload", error)
  }
}

/** The link that launched the app, unless the run before a reload in place handled it */
export const getUnhandledLaunchLink = async () => {
  const url = await Linking.getInitialURL()
  let handledUrl: string | null = null
  try {
    handledUrl = kv.getSync(HANDLED_LAUNCH_LINK_KEY)
    // Skipped once: a later launch by the same link is a new request
    if (handledUrl !== null) void kv.delete(HANDLED_LAUNCH_LINK_KEY)
  } catch (error) {
    console.warn("[deep-link] could not read the handled launch link", error)
  }
  return url && url !== handledUrl ? url : null
}
