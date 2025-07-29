import type { ExtractAtomValue, PrimitiveAtom } from "jotai"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { createContext, useContextSelector } from "use-context-selector"

interface Ctx {
  canSync: PrimitiveAtom<boolean>
}
export const defaultCtx: Ctx = {
  canSync: atom(true),
}
export const SettingContext = createContext<Ctx>(defaultCtx)

export const useSettingContextSelector = <T>(selector: (state: Ctx) => T) => {
  // @ts-expect-error
  return useAtomValue(useContextSelector(SettingContext, selector)) as ExtractAtomValue<T>
}

export const useSetSettingCanSync = () => {
  const canSync = useContextSelector(SettingContext, (s) => s.canSync)
  return useSetAtom(canSync)
}
