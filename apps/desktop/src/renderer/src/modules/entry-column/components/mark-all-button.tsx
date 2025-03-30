import { useViewport } from "@follow/components/hooks/useViewport.js"
import { ActionButton, Button, IconButton } from "@follow/components/ui/button/index.js"
import { Kbd, KbdCombined } from "@follow/components/ui/kbd/Kbd.js"
import { RootPortal } from "@follow/components/ui/portal/index.jsx"
import { useCountdown } from "@follow/hooks"
import { ELECTRON_BUILD } from "@follow/shared/constants"
import { cn, getOS } from "@follow/utils/utils"
import { AnimatePresence, m } from "framer-motion"
import type { FC, ReactNode } from "react"
import { forwardRef, Fragment, useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { Trans, useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useOnClickOutside } from "usehooks-ts"

import { HotKeyScopeMap } from "~/constants"
import { shortcuts } from "~/constants/shortcuts"
import { useI18n } from "~/hooks/common"

import type { MarkAllFilter } from "../hooks/useMarkAll"
import { useMarkAllByRoute } from "../hooks/useMarkAll"

interface MarkAllButtonProps {
  filter?: MarkAllFilter
  className?: string
  which?: ReactNode
  shortcut?: boolean
}

export const MarkAllReadWithOverlay = forwardRef<
  HTMLButtonElement,
  MarkAllButtonProps & {
    containerRef: React.RefObject<HTMLDivElement>
  }
>(({ filter, className, which = "all", shortcut, containerRef }, ref) => {
  const { t } = useTranslation()
  const { t: commonT } = useTranslation("common")

  const [show, setShow] = useState(false)

  const handleMarkAllAsRead = useMarkAllByRoute(filter)

  const [popoverRef, setPopoverRef] = useState<HTMLDivElement | null>(null)
  useOnClickOutside({ current: popoverRef }, () => {
    setShow(false)
  })

  useHotkeys(
    shortcuts.entries.markAllAsRead.key,
    () => {
      setShow(false)

      let cancel = false
      const undo = () => {
        toast.dismiss(id)
        if (cancel) return
        cancel = true
      }
      const id = toast("", {
        description: <ConfirmMarkAllReadInfo undo={undo} />,
        duration: 3000,
        onAutoClose() {
          if (cancel) return
          handleMarkAllAsRead()
        },
        action: {
          label: (
            <span className="flex items-center gap-1">
              {t("mark_all_read_button.undo")}
              <Kbd className="border-border inline-flex items-center border bg-transparent dark:text-white">
                Meta+Z
              </Kbd>
            </span>
          ),
          onClick: undo,
        },
      })
    },
    {
      preventDefault: true,
      scopes: HotKeyScopeMap.Home,
    },
  )

  return (
    <Fragment>
      <ActionButton
        tooltip={
          <>
            <Trans
              i18nKey="mark_all_read_button.mark_as_read"
              components={{
                which: <>{commonT(`words.which.${which}` as any)}</>,
              }}
            />
            {shortcut && (
              <div className="ml-1">
                <KbdCombined className="text-foreground/80">
                  {shortcuts.entries.markAllAsRead.key}
                </KbdCombined>
              </div>
            )}
          </>
        }
        className={className}
        ref={ref}
        onClick={() => {
          setShow(true)
        }}
      >
        <i className="i-mgc-check-circle-cute-re" />
      </ActionButton>

      <AnimatePresence>
        {show && (
          <Popup
            which={which}
            containerRef={containerRef}
            setPopoverRef={setPopoverRef}
            setShow={setShow}
            handleMarkAllAsRead={handleMarkAllAsRead}
          />
        )}
      </AnimatePresence>
    </Fragment>
  )
})

const Popup = ({ which, containerRef, setPopoverRef, setShow, handleMarkAllAsRead }) => {
  const { t } = useTranslation()
  const { t: commonT } = useTranslation("common")
  const $parent = containerRef.current!
  const rect = $parent.getBoundingClientRect()
  const paddingLeft = $parent.offsetLeft

  // change popup's width when viewport changes.
  useViewport((v) => v.w)

  // electron window has pt-[calc(var(--fo-window-padding-top)_-10px)]
  const isElectronWindows = ELECTRON_BUILD && getOS() === "Windows"
  return (
    <RootPortal to={$parent}>
      <m.div
        ref={setPopoverRef}
        initial={{
          transform: `translateY(${isElectronWindows ? "-95px" : "-70px"})`,
        }}
        animate={{
          transform: `translateY(${isElectronWindows ? "-10px" : "0px"})`,
        }}
        exit={{
          transform: `translateY(${isElectronWindows ? "-95px" : "-70px"})`,
        }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="shadow-modal bg-background lg:bg-theme-modal-background-opaque absolute z-50 shadow"
        style={{
          left: -paddingLeft,
          top: rect.top,
          width: rect.width,
        }}
      >
        <div className="flex w-full translate-x-[-2px] items-center justify-between gap-3 !py-3 pl-6 pr-3 [&_button]:text-xs">
          <span className="center gap-[calc(0.5rem+2px)]">
            <i className="i-mgc-check-circle-cute-re" />
            <span className="text-sm font-bold">
              <Trans
                i18nKey="mark_all_read_button.confirm_mark_all"
                components={{
                  which: <>{commonT(`words.which.${which}` as any)}</>,
                }}
              />
            </span>
          </span>
          <div className="space-x-4">
            <IconButton
              icon={<i className="i-mgc-check-filled" />}
              onClick={() => {
                handleMarkAllAsRead()
                setShow(false)
              }}
            >
              {t("words.confirm")}
            </IconButton>
          </div>
        </div>
      </m.div>
    </RootPortal>
  )
}

const ConfirmMarkAllReadInfo = ({ undo }: { undo: () => any }) => {
  const { t } = useTranslation()
  const [countdown] = useCountdown({ countStart: 3 })

  useHotkeys("ctrl+z,meta+z", undo, {
    scopes: HotKeyScopeMap.Home,
    preventDefault: true,
  })

  return (
    <div>
      <p>{t("mark_all_read_button.confirm_mark_all_info")}</p>
      <small className="opacity-50">
        {t("mark_all_read_button.auto_confirm_info", { countdown })}
      </small>
    </div>
  )
}

export const FlatMarkAllReadButton: FC<MarkAllButtonProps> = (props) => {
  const t = useI18n()

  const { className, filter, which } = props
  const [status, setStatus] = useState<"initial" | "confirm" | "done">("initial")
  const handleMarkAll = useMarkAllByRoute(filter)

  const animate = {
    initial: { rotate: -30, opacity: 0.9 },
    exit: { rotate: -30, opacity: 0.9 },
    animate: { rotate: 0, opacity: 1 },
  }
  return (
    <Button
      variant="ghost"
      disabled={status === "done"}
      className={cn(
        "center relative flex h-auto gap-1",

        className,
      )}
      onMouseLeave={() => {
        if (status === "confirm") {
          setStatus("initial")
        }
      }}
      onClick={() => {
        if (status === "confirm") {
          handleMarkAll()
            .then(() => setStatus("done"))
            .catch(() => setStatus("initial"))
          return
        }

        setStatus("confirm")
      }}
    >
      <AnimatePresence mode="wait">
        {status === "confirm" ? (
          <m.i key={1} {...animate} className="i-mgc-question-cute-re" />
        ) : (
          <m.i key={2} {...animate} className="i-mgc-check-circle-cute-re" />
        )}
      </AnimatePresence>
      <span className={cn(status === "confirm" ? "opacity-0" : "opacity-100", "duration-200")}>
        <Trans
          i18nKey="mark_all_read_button.mark_as_read"
          components={{
            which: (
              <>{typeof which === "string" ? t.common(`words.which.${which}` as any) : which}</>
            ),
          }}
        />
      </span>
      <span
        className={cn(
          "center absolute inset-y-0 left-5 right-0 flex",
          status === "confirm" ? "opacity-100" : "opacity-0",
          "duration-200",
        )}
      >
        {t("mark_all_read_button.confirm")}
      </span>
    </Button>
  )
}
