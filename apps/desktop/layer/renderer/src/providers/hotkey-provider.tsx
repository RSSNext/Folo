import type { PropsWithChildren } from "react"
import { createContext, use, useEffect } from "react"
import { HotkeysProvider, useHotkeysContext } from "react-hotkeys-hook"

import { HotkeyScope } from "~/constants"
import { appLog } from "~/lib/log"

import { GlobalHotkeysProvider } from "./global-hotkeys-provider"

const initialActiveScopes = [HotkeyScope.Home]

const HotkeyScopeContext = createContext<HotkeyScope[]>(null!)
export const HotkeyProvider: Component = ({ children }) => {
  return (
    <HotkeysProvider initiallyActiveScopes={initialActiveScopes}>
      <HotkeyScopeProvider>
        {children}
        <GlobalHotkeysProvider />
      </HotkeyScopeProvider>
    </HotkeysProvider>
  )
}

const HotkeyScopeProvider = ({ children }: PropsWithChildren) => {
  const { activeScopes } = useHotkeysContext()

  if (import.meta.env.DEV) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      appLog("activeScopes change to:", activeScopes)
    }, [JSON.stringify(activeScopes)])
  }
  return <HotkeyScopeContext value={activeScopes as HotkeyScope[]}>{children}</HotkeyScopeContext>
}

export const useHotkeyScope = () => {
  const hotkeyScope = use(HotkeyScopeContext)
  if (!hotkeyScope) {
    throw new Error("HotkeyScopeContext not found")
  }
  return hotkeyScope
}
