import { useEntry, usePrefetchEntryDetail } from "@follow/store/entry/hooks"
import { useCallback } from "react"

import { PeekModal } from "~/components/ui/modal/inspire/PeekModal"
import { PlainModal } from "~/components/ui/modal/stacked/custom-modal"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { EntryModalPreview } from "~/components/ui/peek-modal/EntryModalPreview"
import { EntryMoreActions } from "~/components/ui/peek-modal/EntryMoreActions"
import { EntryToastPreview } from "~/components/ui/peek-modal/EntryToastPreview"
import { getRouteParams } from "~/hooks/biz/useRouteParams"

export const usePeekModal = () => {
  const { present } = useModalStack()
  return useCallback(
    (entryId: string, variant: "toast" | "modal") => {
      const basePresentProps = {
        clickOutsideToDismiss: true,
        title: "Entry Preview",
      }

      if (variant === "toast") {
        present({
          ...basePresentProps,
          CustomModalComponent: PlainModal,
          content: () => <EntryToastPreview entryId={entryId} />,
          overlay: false,
          modal: false,
          modalContainerClassName: "right-0 left-[auto]",
        })
      } else {
        present({
          ...basePresentProps,
          autoFocus: false,
          modalClassName:
            "relative mx-auto mt-[10vh] scrollbar-none max-w-full overflow-auto px-2 lg:max-w-[65rem] lg:p-0",

          CustomModalComponent: ({ children }) => {
            usePrefetchEntryDetail(entryId)
            const feedId = useEntry(entryId, (state) => state.feedId)

            if (!feedId) return null

            return (
              <PeekModal
                rightActions={[
                  {
                    onClick: () => {},
                    label: "More Actions",
                    icon: <EntryMoreActions entryId={entryId} />,
                  },
                ]}
                to={`/timeline/view-${getRouteParams().view}/${feedId}/${entryId}`}
              >
                {children}
              </PeekModal>
            )
          },
          content: () => <EntryModalPreview entryId={entryId} />,
          overlay: true,
        })
      }
    },
    [present],
  )
}
