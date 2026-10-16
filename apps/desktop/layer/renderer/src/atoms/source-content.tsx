import { atom, useAtomValueRawSync } from "jotai"
import { useCallback } from "react"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { createAtomHooks, jotaiStore } from "~/lib/jotai"
import { SourceContentView } from "~/modules/entry-content/components/SourceContentView"

const showSourceContentAtom = atom<boolean>(false)
export const [, , , , getShowSourceContent, setShowSourceContent] =
  createAtomHooks(showSourceContentAtom)

// The auto "view source content" entry action enables it in a passive effect of the commit that
// mounts the entry content, before the source panel of that commit subscribes. Jotai v3
// `useAtomValue` would miss it; `useAtomValueRawSync` re-checks after subscribing.
export const useShowSourceContent = () =>
  useAtomValueRawSync(showSourceContentAtom, { store: jotaiStore })

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
