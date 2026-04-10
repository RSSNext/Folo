import type { Manifest } from "expo-updates"
import * as Updates from "expo-updates"
import type { PropsWithChildren } from "react"
import { createContext, use, useEffect, useMemo, useReducer } from "react"
import { InteractionManager } from "react-native"

import { initialOtaState, reduceOtaState } from "./store"
import type { OtaState } from "./types"

const OtaContext = createContext<OtaState>(initialOtaState)

const resolvePendingVersion = (manifest: Manifest | undefined): string => {
  if (!manifest) {
    return Updates.runtimeVersion ?? "unknown"
  }

  const metadataVersion =
    "metadata" in manifest && manifest.metadata && typeof manifest.metadata === "object"
      ? Reflect.get(manifest.metadata, "version")
      : undefined

  if (typeof metadataVersion === "string" && metadataVersion.length > 0) {
    return metadataVersion
  }

  const expoClientVersion =
    "extra" in manifest &&
    manifest.extra?.expoClient &&
    typeof manifest.extra.expoClient.version === "string"
      ? manifest.extra.expoClient.version
      : undefined

  if (expoClientVersion) {
    return expoClientVersion
  }

  if ("runtimeVersion" in manifest && typeof manifest.runtimeVersion === "string") {
    return manifest.runtimeVersion
  }

  return Updates.runtimeVersion ?? "unknown"
}

export const OtaProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(reduceOtaState, initialOtaState)

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) {
      return
    }

    let isCancelled = false

    const runBackgroundCheck = async () => {
      try {
        dispatch({ type: "checking" })

        const checkResult = await Updates.checkForUpdateAsync()
        if (isCancelled) {
          return
        }

        if (!checkResult.isAvailable) {
          dispatch({ type: "reset" })
          return
        }

        dispatch({ type: "downloading" })
        const fetchResult = await Updates.fetchUpdateAsync()
        if (isCancelled) {
          return
        }

        if (fetchResult.isNew && fetchResult.manifest) {
          dispatch({
            type: "downloaded",
            version: resolvePendingVersion(fetchResult.manifest),
          })
          return
        }

        dispatch({ type: "reset" })
      } catch (error) {
        if (isCancelled) {
          return
        }

        dispatch({
          type: "failed",
          message: error instanceof Error ? error.message : "Failed to check for updates.",
        })
      }
    }

    const task = InteractionManager.runAfterInteractions(() => {
      void runBackgroundCheck()
    })

    return () => {
      isCancelled = true
      task.cancel()
    }
  }, [])

  const value = useMemo(() => state, [state])

  return <OtaContext value={value}>{children}</OtaContext>
}

export const useOtaState = () => use(OtaContext)
