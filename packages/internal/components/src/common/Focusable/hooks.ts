import { EnhanceSet } from "@follow/utils"
import { jotaiStore } from "@follow/utils/jotai"
import { useAtomValue, useSetAtom } from "jotai"
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

export const useGlobalFocusableHasScope = (scope: string) => {
  return useGlobalFocusableScopeSelector(useCallback((v) => v.has(scope), [scope]))
}
export const useGlobalFocusableScopeSelector = (
  selector: (scope: EnhanceSet<string>) => boolean,
) => {
  const ctx = use(GlobalFocusableContext)

  return useAtomValue(useMemo(() => selectAtom(ctx, selector), [ctx, selector]))
}

export const useSetGlobalFocusableScope = () => {
  const ctx = use(GlobalFocusableContext)
  const setter = useSetAtom(ctx)
  return useCallback(
    (scope: string, mode: "append" | "switch" | "remove") => {
      const snapshot = jotaiStore.get(ctx)
      setter((v) => {
        if (mode === "append") {
          if (v.has(scope)) {
            return v
          }
          const newSet = v.clone()
          newSet.add(scope)
          return newSet
        } else if (mode === "switch") {
          const newSet = v.clone()

          if (newSet.has(scope)) {
            newSet.delete(scope)
          } else {
            newSet.add(scope)
          }
          return newSet
        } else {
          if (!v.has(scope)) return v
          const newSet = v.clone()
          newSet.delete(scope)
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

export const useReplaceGlobalFocusableScope = () => {
  const ctx = use(GlobalFocusableContext)
  const setter = useSetAtom(ctx)
  return useCallback(
    (...scopes: string[]) => {
      const snapshot = jotaiStore.get(ctx)
      setter(() => {
        const newSet = EnhanceSet.of<string>()
        for (const scope of scopes) {
          newSet.add(scope)
        }
        return newSet
      })
      return {
        rollback: () => {
          setter(snapshot)
        },
      }
    },
    [ctx, setter],
  )
}
