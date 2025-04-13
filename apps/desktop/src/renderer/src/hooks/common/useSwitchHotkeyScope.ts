import { useCallback, useLayoutEffect, useRef } from "react"
import { useHotkeysContext } from "react-hotkeys-hook"

import { HotKeyScopeMap } from "~/constants"

const allScopes = Object.keys(HotKeyScopeMap).reduce((acc, key) => {
  acc.push(...HotKeyScopeMap[key])
  return acc
}, [] as string[])
export const useSwitchHotKeyScope = () => {
  const { enableScope, disableScope } = useHotkeysContext()

  return useCallback(
    (scope: keyof typeof HotKeyScopeMap) => {
      const nextScope = HotKeyScopeMap[scope]
      if (!nextScope) return

      for (const key of allScopes) {
        disableScope(key)
      }
      for (const key of nextScope) {
        enableScope(key)
      }
    },
    [disableScope, enableScope],
  )
}
export const useHotkeyScopeFn = (scope: keyof typeof HotKeyScopeMap) => {
  const { enableScope, disableScope, activeScopes } = useHotkeysContext()
  const currentScopeRef = useRef(activeScopes)

  return useCallback(() => {
    const currentScope = currentScopeRef.current
    for (const key of allScopes) {
      disableScope(key)
    }
    for (const key of scope) {
      enableScope(key)
    }
    return () => {
      for (const key of scope) {
        disableScope(key)
      }
      for (const scope of currentScope) {
        enableScope(scope)
      }
    }
  }, [enableScope, disableScope, scope])
}

export const useHotkeyScope = (scope: keyof typeof HotKeyScopeMap, when: boolean) => {
  const fn = useHotkeyScopeFn(scope)
  useLayoutEffect(() => {
    if (when) {
      return fn()
    }
  }, [fn, when])
}
