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

  const metadataReleaseVersion =
    "metadata" in manifest && manifest.metadata && typeof manifest.metadata === "object"
      ? Reflect.get(manifest.metadata, "releaseVersion")
      : undefined

  if (typeof metadataReleaseVersion === "string" && metadataReleaseVersion.length > 0) {
    return metadataReleaseVersion
  }

  if ("runtimeVersion" in manifest && typeof manifest.runtimeVersion === "string") {
    return manifest.runtimeVersion
  }

  return Updates.runtimeVersion ?? "unknown"
}

export const OtaProvider = ({ children }: PropsWithChildren) => {
  const { checkError, downloadError, downloadedUpdate, isUpdatePending } = Updates.useUpdates()
  const [state, dispatch] = useReducer(reduceOtaState, initialOtaState)

  const nativePendingVersion = useMemo(() => {
    if (!isUpdatePending || downloadedUpdate?.type !== Updates.UpdateInfoType.NEW) {
      return null
    }

    return resolvePendingVersion(downloadedUpdate.manifest)
  }, [downloadedUpdate, isUpdatePending])

  useEffect(() => {
    if (!nativePendingVersion) {
      return
    }

    dispatch({
      type: "downloaded",
      version: nativePendingVersion,
    })
  }, [nativePendingVersion])

  useEffect(() => {
    const error = downloadError || checkError
    if (!error) {
      return
    }

    dispatch({
      type: "failed",
      message: error.message,
    })
  }, [checkError, downloadError])

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled || nativePendingVersion) {
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
          if (!isUpdatePending) {
            dispatch({ type: "reset" })
          }
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

        if (!isUpdatePending) {
          dispatch({ type: "reset" })
        }
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
  }, [isUpdatePending, nativePendingVersion])

  const value = useMemo(() => {
    if (!nativePendingVersion) {
      return state
    }

    return {
      status: "ready" as const,
      pendingVersion: nativePendingVersion,
      errorMessage: null,
    }
  }, [nativePendingVersion, state])

  return <OtaContext value={value}>{children}</OtaContext>
}

export const useOtaState = () => use(OtaContext)
