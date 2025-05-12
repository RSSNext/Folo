import { useCallback, useLayoutEffect, useRef } from "react"
import { useHotkeysContext } from "react-hotkeys-hook"

import { HotkeyScope } from "~/constants"

const allScopes = Object.keys(HotkeyScope).reduce((acc, key) => {
  acc.push(HotkeyScope[key])
  return acc
}, [] as string[])

export const useSwitchHotKeyScope = () => {
  const { enableScope, disableScope } = useHotkeysContext()

  return useCallback(
    (scope: keyof typeof HotkeyScope) => {
      const nextScope = HotkeyScope[scope]
      if (!nextScope) return

      for (const key of allScopes) {
        disableScope(key)
      }
      enableScope(nextScope)
    },
    [disableScope, enableScope],
  )
}
export const useConditionalHotkeyScopeFn = (scope: HotkeyScope, replaceAll = true) => {
  const { enableScope, disableScope, activeScopes } = useHotkeysContext()
  const currentScopeRef = useRef(activeScopes)

  return useCallback(() => {
    const currentScope = currentScopeRef.current
    if (replaceAll) {
      for (const key of allScopes) {
        disableScope(key)
      }
    }
    enableScope(scope)
    return () => {
      disableScope(scope)
      if (replaceAll) {
        for (const key of currentScope) {
          enableScope(key)
        }
      }
    }
  }, [enableScope, disableScope, scope, replaceAll])
}

export const useConditionalHotkeyScope = (scope: HotkeyScope, when: boolean, append = false) => {
  const fn = useConditionalHotkeyScopeFn(scope, !append)
  useLayoutEffect(() => {
    if (when) {
      return fn()
    }
  }, [fn, when])
}
