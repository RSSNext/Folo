import { jotaiStore } from "@follow/utils/jotai"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { selectAtom } from "jotai/utils"
import { use, useCallback, useMemo } from "react"

import {
  FocusableContainerRefContext,
  FocusableContext,
  FocusActionsContext,
  FocusTargetRefContext,
  GlobalFocusableContext,
} from "./context"

export const useFocusable = () => {
  return use(FocusableContext)
}

export const useFocusTargetRef = () => {
  return use(FocusTargetRefContext)
}

export const useFocusActions = () => {
  return use(FocusActionsContext)
}

export const useFocusableContainerRef = () => {
  return use(FocusableContainerRefContext)
}

export const useGlobalFocusableScope = () => {
  return useAtomValue(use(GlobalFocusableContext))
}

export const useGlobalFocusableHasScope = (scope: string) => {
  const ctx = use(GlobalFocusableContext)
  return useAtom(useMemo(() => selectAtom(ctx, (v) => v.has(scope)), [ctx, scope]))
}

export const useSetGlobalFocusableScope = () => {
  const ctx = use(GlobalFocusableContext)
  const setter = useSetAtom(ctx)
  return useCallback(
    (scope: string, mode: "append" | "switch" | "replace" | "remove") => {
      const snapshot = jotaiStore.get(ctx)
      setter((v) => {
        if (mode === "remove") {
          const newSet = new Set(v)
          newSet.delete(scope)
          return newSet
        }
        if (mode === "append") {
          const newSet = new Set(v)
          newSet.add(scope)
          return newSet
        } else if (mode === "switch") {
          const newSet = new Set(v)

          if (newSet.has(scope)) {
            newSet.delete(scope)
          } else {
            newSet.add(scope)
          }
          return newSet
        } else {
          const newSet = new Set<string>()
          newSet.add(scope)

          return newSet
        }
      })

      return {
        original: snapshot,
        new: jotaiStore.get(ctx),
      }
    },
    [ctx, setter],
  )
}
