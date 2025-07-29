import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { clsx } from "@follow/utils/utils"
import { m, useDragControls } from "motion/react"
import { useTranslation } from "react-i18next"

import { useUISettingKey } from "~/atoms/settings/ui"
import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"

import { ShortcutsGuideline } from "../command/shortcuts/SettingShortcuts"

export const ShortcutModalContent = () => {
  const { dismiss } = useCurrentModal()
  const modalOverlay = useUISettingKey("modalOverlay")
  const dragControls = useDragControls()

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
        <div className="w-full space-y-6 px-4 pb-5">
          <ShortcutsGuideline />
        </div>
      </ScrollArea.ScrollArea>
    </m.div>
  )
}
