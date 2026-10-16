import { useTitle } from "@follow/hooks"
import { atom, useAtomValue, useAtomValueRawSync, useSetAtom } from "jotai"
import type { ReactNode } from "react"
import { useEffect } from "react"

import { useI18n } from "~/hooks/common"

const titleAtom = atom<string | ReactNode | null>(null)

const rightViewAtom = atom<ReactNode | null>(null)

export function useSubViewTitle(title: I18nKeys): void
export function useSubViewTitle(title: ReactNode, fallbackTitleString: string): void

export function useSubViewTitle(title: I18nKeys | ReactNode, fallbackTitleString?: string) {
  const t = useI18n()
  useTitle(typeof title === "string" ? t(title as I18nKeys) : fallbackTitleString)

  const setTitle = useSetAtom(titleAtom)
  useEffect(() => {
    setTitle(typeof title === "string" ? t(title as I18nKeys) : title)
  }, [setTitle, t, title])
}

// Pages set the title in an effect, which runs before `SubviewLayout` (their ancestor) subscribes
// when both mount in the same commit. Jotai v3 `useAtomValue` would keep the previous title;
// `useAtomValueRawSync` re-checks after subscribing.
export const useSubViewTitleValue = () => useAtomValueRawSync(titleAtom)

export const useSubViewRightView = () => useAtomValue(rightViewAtom)

export const useSetSubViewRightView = () => useSetAtom(rightViewAtom)
