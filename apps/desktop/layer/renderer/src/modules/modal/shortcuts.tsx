import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { KbdCombined } from "@follow/components/ui/kbd/Kbd.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { clsx, cn } from "@follow/utils/utils"
import { m, useDragControls } from "motion/react"
import { useCallback, useEffect } from "react"
import { useTranslation } from "react-i18next"

import { useUISettingKey } from "~/atoms/settings/ui"
import { PlainModal } from "~/components/ui/modal/stacked/custom-modal"
import { useCurrentModal, useModalStack } from "~/components/ui/modal/stacked/hooks"
import { shortcuts, shortcutsType } from "~/constants/shortcuts"
import { useSwitchHotKeyScope } from "~/hooks/common"

const ShortcutModalContent = () => {
  const { dismiss } = useCurrentModal()
  const modalOverlay = useUISettingKey("modalOverlay")
  const dragControls = useDragControls()

  const switchScope = useSwitchHotKeyScope()
  useEffect(() => {
    switchScope("Home")
  }, [])
  const { t } = useTranslation("shortcuts")
  return (
    <m.div
      drag
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      exit={{
        scale: 0.96,
        opacity: 0,
      }}
      whileDrag={{
        cursor: "grabbing",
      }}
      className={clsx(
        "center bg-background absolute inset-0 m-auto flex max-h-[80vh] w-[60ch] max-w-[90vw] flex-col rounded-xl border",

        !modalOverlay && "shadow-modal",
      )}
    >
      <h2
        onPointerDownCapture={dragControls.start.bind(dragControls)}
        className="center w-full border-b p-3 font-medium"
      >
        {t("shortcuts.guide.title", { ns: "app" })}
      </h2>
      <MotionButtonBase onClick={dismiss} className="absolute right-3 top-2 p-2">
        <i className="i-mgc-close-cute-re" />
      </MotionButtonBase>
      <ScrollArea.ScrollArea scrollbarClassName="w-2" rootClassName="w-full h-full">
        <div className="w-full space-y-6 px-4 pb-5 pt-6">
          {Object.keys(shortcuts).map((type) => (
            <section key={type}>
              <div className="text-text-secondary mb-2 pl-3 text-xs font-medium capitalize">
                {t(shortcutsType[type])}
              </div>
              <div className="text-text rounded-md border text-[13px]">
                {Object.keys(shortcuts[type]).map((action, index) => (
                  <div
                    key={`${type}-${action}`}
                    className={cn(
                      "flex h-9 items-center justify-between px-3 py-1.5",
                      index % 2 && "bg-fill-quinary",
                    )}
                  >
                    <div>{t(shortcuts[type][action].name)}</div>
                    <div>
                      <KbdCombined joint>
                        {`${shortcuts[type][action].key}${shortcuts[type][action].extra ? `, ${shortcuts[type][action].extra}` : ""}`}
                      </KbdCombined>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </ScrollArea.ScrollArea>
    </m.div>
  )
}

export const useShortcutsModal = () => {
  const { present, dismiss, getModalStackById } = useModalStack()
  const id = "shortcuts"

  const showShortcutsModal = useCallback(() => {
    present({
      title: "Shortcuts",
      id,
      overlay: false,
      content: () => <ShortcutModalContent />,
      CustomModalComponent: PlainModal,
      clickOutsideToDismiss: true,
    })
  }, [present])

  return useCallback(() => {
    const shortcutsModal = getModalStackById(id)
    if (shortcutsModal && shortcutsModal.modal) {
      dismiss(id)
      return
    }
    showShortcutsModal()
  }, [dismiss, getModalStackById, showShortcutsModal])
}
