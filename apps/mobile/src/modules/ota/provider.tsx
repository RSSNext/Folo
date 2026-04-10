import { nativeApplicationVersion } from "expo-application"
import type { Manifest } from "expo-updates"
import * as Updates from "expo-updates"
import type {
  ActionDispatch,
  Dispatch,
  MutableRefObject,
  PropsWithChildren,
  SetStateAction,
} from "react"
import { createContext, use, useEffect, useMemo, useReducer, useRef, useState } from "react"
import { InteractionManager } from "react-native"

import type { StorePolicyResponse } from "./client"
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

  try {
    if (currentPendingVersion) {
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
    dispatchIfActive({
      type: "failed",
      message: getErrorMessage(error, "Failed to check for updates."),
    })

    throw error instanceof Error ? error : new Error("Failed to check for updates.")
  }
}

const refreshStorePolicyInBackground = ({
  setStorePolicy,
  shouldCancel = () => false,
}: {
  setStorePolicy: Dispatch<SetStateAction<StorePolicyResponse | null>>
  shouldCancel?: () => boolean
}) => {
  void fetchStorePolicy({
    baseUrl: OtaBaseUrl,
    product: OtaProduct,
    channel: getOtaChannel(),
    installedBinaryVersion: getInstalledBinaryVersion(),
  })
    .then((policy) => {
      if (!shouldCancel()) {
        setStorePolicy(policy)
      }
    })
    .catch((error) => {
      console.warn("[ota] Failed to fetch store policy", error)
    })
}

const runGuardedOtaCheck = ({
  dispatch,
  setStorePolicy,
  inFlightRef,
  currentPendingVersion,
  isUpdatePending,
  shouldCancel = () => false,
}: {
  dispatch: ActionDispatch<[action: OtaAction]>
  setStorePolicy: Dispatch<SetStateAction<StorePolicyResponse | null>>
  inFlightRef: MutableRefObject<Promise<OtaCheckForUpdatesResult> | null>
  currentPendingVersion: string | null
  isUpdatePending: boolean
  shouldCancel?: () => boolean
}) => {
  if (!Updates.isEnabled) {
    return Promise.resolve({ kind: "idle" } satisfies OtaCheckForUpdatesResult)
  }

  if (inFlightRef.current) {
    return inFlightRef.current
  }

  refreshStorePolicyInBackground({
    setStorePolicy,
    shouldCancel,
  })

  const promise = runOtaCheck({
    dispatch,
    currentPendingVersion,
    isUpdatePending,
    shouldCancel,
  }).finally(() => {
    if (inFlightRef.current === promise) {
      inFlightRef.current = null
    }
  })

  inFlightRef.current = promise
  return promise
}

export const OtaProvider = ({ children }: PropsWithChildren) => {
  const { checkError, downloadError, downloadedUpdate, isUpdatePending } = Updates.useUpdates()
  const [state, dispatch] = useReducer(reduceOtaState, initialOtaState)
  const [, setStorePolicy] = useState<StorePolicyResponse | null>(null)
  const checkInFlightRef = useRef<Promise<OtaCheckForUpdatesResult> | null>(null)
  const isUnmountedRef = useRef(false)

  const nativePendingVersion = useMemo(() => {
    if (!isUpdatePending || downloadedUpdate?.type !== Updates.UpdateInfoType.NEW) {
      return null
    }

    return resolvePendingVersion(downloadedUpdate.manifest)
  }, [downloadedUpdate, isUpdatePending])

  const currentPendingVersion = nativePendingVersion ?? state.pendingVersion

  useEffect(() => {
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

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

    const runBackgroundCheck = async () => {
      try {
        await runGuardedOtaCheck({
          dispatch,
          setStorePolicy,
          inFlightRef: checkInFlightRef,
          currentPendingVersion: nativePendingVersion,
          isUpdatePending,
          shouldCancel: () => isUnmountedRef.current,
        })
      } catch {
        // runOtaCheck already syncs OTA failures into state.
      }
    }

    const task = InteractionManager.runAfterInteractions(() => {
      void runBackgroundCheck()
    })

    return () => {
      task.cancel()
    }
  }, [isUpdatePending, nativePendingVersion])

  const actions = useMemo<OtaActions>(() => {
    return {
      checkForUpdates: async () =>
        runGuardedOtaCheck({
          dispatch,
          setStorePolicy,
          inFlightRef: checkInFlightRef,
          currentPendingVersion,
          isUpdatePending,
          shouldCancel: () => isUnmountedRef.current,
        }),
      reloadUpdate: async () => {
        if (!Updates.isEnabled || !currentPendingVersion) {
          return
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
