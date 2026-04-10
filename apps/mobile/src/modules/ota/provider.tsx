import { nativeApplicationVersion } from "expo-application"
import type { Manifest } from "expo-updates"
import * as Updates from "expo-updates"
import type { ActionDispatch, PropsWithChildren } from "react"
import { createContext, use, useEffect, useMemo, useReducer } from "react"
import { InteractionManager } from "react-native"

import { fetchStorePolicy } from "./client"
import { initialOtaState, reduceOtaState } from "./store"
import type { OtaAction, OtaState } from "./types"

const OtaContext = createContext<OtaState>(initialOtaState)
const OtaBaseUrl = "https://ota.folo.is"
const OtaProduct = "mobile"

export type OtaCheckForUpdatesResult = { kind: "available"; version: string } | { kind: "idle" }

interface OtaActions {
  checkForUpdates: () => Promise<OtaCheckForUpdatesResult>
  reloadUpdate: () => Promise<void>
}

const OtaActionsContext = createContext<OtaActions>({
  checkForUpdates: async () => ({ kind: "idle" }),
  reloadUpdate: async () => {},
})

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

const getOtaChannel = () => Updates.channel ?? "default"

const getInstalledBinaryVersion = () =>
  nativeApplicationVersion ?? Updates.runtimeVersion ?? "unknown"

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback
}

const refreshStorePolicy = async () => {
  try {
    return await fetchStorePolicy({
      baseUrl: OtaBaseUrl,
      product: OtaProduct,
      channel: getOtaChannel(),
      installedBinaryVersion: getInstalledBinaryVersion(),
    })
  } catch (error) {
    console.warn("[ota] Failed to fetch store policy", error)
    return null
  }
}

const runOtaCheck = async ({
  dispatch,
  currentPendingVersion,
  isUpdatePending,
  shouldCancel = () => false,
}: {
  dispatch: ActionDispatch<[action: OtaAction]>
  currentPendingVersion: string | null
  isUpdatePending: boolean
  shouldCancel?: () => boolean
}): Promise<OtaCheckForUpdatesResult> => {
  const dispatchIfActive = (action: OtaAction) => {
    if (!shouldCancel()) {
      dispatch(action)
    }
  }

  const policyPromise = refreshStorePolicy()

  try {
    if (currentPendingVersion) {
      await policyPromise
      if (shouldCancel()) {
        return { kind: "idle" }
      }

      dispatchIfActive({
        type: "downloaded",
        version: currentPendingVersion,
      })
      return { kind: "available", version: currentPendingVersion }
    }

    dispatchIfActive({ type: "checking" })

    const checkResult = await Updates.checkForUpdateAsync()
    if (shouldCancel()) {
      return { kind: "idle" }
    }

    if (!checkResult.isAvailable) {
      await policyPromise
      if (!isUpdatePending) {
        dispatchIfActive({ type: "reset" })
      }
      return { kind: "idle" }
    }

    dispatchIfActive({ type: "downloading" })

    const fetchResult = await Updates.fetchUpdateAsync()
    if (shouldCancel()) {
      return { kind: "idle" }
    }

    await policyPromise

    if (fetchResult.isNew && fetchResult.manifest) {
      const version = resolvePendingVersion(fetchResult.manifest)
      dispatchIfActive({
        type: "downloaded",
        version,
      })
      return { kind: "available", version }
    }

    if (!isUpdatePending) {
      dispatchIfActive({ type: "reset" })
    }

    return { kind: "idle" }
  } catch (error) {
    await policyPromise

    dispatchIfActive({
      type: "failed",
      message: getErrorMessage(error, "Failed to check for updates."),
    })

    throw error instanceof Error ? error : new Error("Failed to check for updates.")
  }
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

  const currentPendingVersion = nativePendingVersion ?? state.pendingVersion

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
        await runOtaCheck({
          dispatch,
          currentPendingVersion: nativePendingVersion,
          isUpdatePending,
          shouldCancel: () => isCancelled,
        })
      } catch {
        // runOtaCheck already syncs OTA failures into state.
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

  const actions = useMemo<OtaActions>(() => {
    return {
      checkForUpdates: async () => {
        if (!Updates.isEnabled) {
          throw new Error("OTA updates are not enabled.")
        }

        return runOtaCheck({
          dispatch,
          currentPendingVersion,
          isUpdatePending,
        })
      },
      reloadUpdate: async () => {
        if (!Updates.isEnabled) {
          throw new Error("OTA updates are not enabled.")
        }

        if (!currentPendingVersion) {
          throw new Error("No OTA update is ready to reload.")
        }

        await Updates.reloadAsync()
      },
    }
  }, [currentPendingVersion, isUpdatePending])

  const value = useMemo(() => {
    if (!currentPendingVersion) {
      return state
    }

    return {
      status: "ready" as const,
      pendingVersion: currentPendingVersion,
      errorMessage: null,
    }
  }, [currentPendingVersion, state])

  return (
    <OtaActionsContext value={actions}>
      <OtaContext value={value}>{children}</OtaContext>
    </OtaActionsContext>
  )
}

export const useOtaState = () => use(OtaContext)
export const useOtaActions = () => use(OtaActionsContext)
