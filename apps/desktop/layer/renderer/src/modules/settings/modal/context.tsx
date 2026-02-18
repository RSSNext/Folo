import type { PrimitiveAtom } from "jotai"
import { atom } from "jotai"
import { createContext, use, useMemo } from "react"

import { createAtomHooks } from "~/lib/jotai"

const SettingTabContext = createContext<ReturnType<typeof createAtomHooks<string>>>(null!)
export const SettingTabProvider = ({
  children,
  initialTab,
}: {
  children: React.ReactNode
  initialTab?: string
}) => {
  const ctxValue = useMemo(() => {
    return createAtomHooks(atom(initialTab ?? ""))
  }, [])
  return <SettingTabContext value={ctxValue}>{children}</SettingTabContext>
}

const useSettingTabContext = () => {
  const ctx = use(SettingTabContext)
  if (!ctx) {
    throw new Error("SettingTabContext not found")
  }
  return ctx
}
export const useSettingTab = () => {
  return useSettingTabContext()[2]()
}

export const useSetSettingTab = () => {
  return useSettingTabContext()[3]()
}

export const SettingModalContentPortalableContext = createContext<PrimitiveAtom<HTMLElement>>(
  atom(null as any),
)
