import { useTitle } from "@follow/hooks"
import { atom, useAtomValue, useSetAtom } from "jotai"
import type { ReactNode } from "react"
import { useEffect } from "react"

import { useI18n } from "~/hooks/common"

const titleAtom = atom<string | ReactNode | null>(null)

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

export const useSubViewTitleValue = () => useAtomValue(titleAtom)
