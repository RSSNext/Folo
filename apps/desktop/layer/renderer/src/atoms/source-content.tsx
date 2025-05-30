import { atom } from "jotai"
import { useCallback } from "react"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { createAtomHooks } from "~/lib/jotai"
import { SourceContentView } from "~/modules/entry-content/components/SourceContentView"

export const [, , useShowSourceContent, , getShowSourceContent, setShowSourceContent] =
  createAtomHooks(atom<boolean>(false))

export const toggleShowSourceContent = () => setShowSourceContent(!getShowSourceContent())
export const enableShowSourceContent = () => setShowSourceContent(true)
export const resetShowSourceContent = () => setShowSourceContent(false)

export const useSourceContentModal = () => {
  const { present } = useModalStack()

  return useCallback(
    ({ title, src }: { title?: string; src: string }) => {
      present({
        id: src,
        title,
        content: () => <SourceContentView src={src} />,
        resizeable: true,
        clickOutsideToDismiss: true,
        max: true,
      })
    },
    [present],
  )
}
