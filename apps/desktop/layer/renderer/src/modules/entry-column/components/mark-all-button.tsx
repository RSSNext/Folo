import { useGlobalFocusableScopeSelector } from "@follow/components/common/Focusable/hooks.js"
import { ActionButton, Button } from "@follow/components/ui/button/index.js"
import { Kbd, KbdCombined } from "@follow/components/ui/kbd/Kbd.js"
import { useCountdown } from "@follow/hooks"
import { EventBus } from "@follow/utils/event-bus"
import { cn } from "@follow/utils/utils"
import type { FC, ReactNode } from "react"
import { useCallback, useEffect, useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { Trans, useTranslation } from "react-i18next"
import { toast } from "sonner"

import { HotkeyScope } from "~/constants"
import { getRouteParams } from "~/hooks/biz/useRouteParams"
import { useI18n } from "~/hooks/common"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { useCommandBinding, useCommandShortcuts } from "~/modules/command/hooks/use-command-binding"

import type { MarkAllFilter } from "../hooks/useMarkAll"
import { markAllByRoute } from "../hooks/useMarkAll"

interface MarkAllButtonProps {
  className?: string
  which?: ReactNode
  shortcut?: boolean
}

export const MarkAllReadButton = ({
  ref,
  className,
  which = "all",
  shortcut,
}: MarkAllButtonProps & { ref?: React.Ref<HTMLButtonElement | null> }) => {
  const { t } = useTranslation()
  const { t: commonT } = useTranslation("common")

  // const activeScope = useGlobalFocusableScope()
  const when = useGlobalFocusableScopeSelector(
    // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-callback
    useCallback(
      (activeScope) => activeScope.or(HotkeyScope.Timeline, HotkeyScope.SubscriptionList),
      [],
    ),
  )
  useCommandBinding({
    commandId: COMMAND_ID.subscription.markAllAsRead,
    when,
  })

  useEffect(() => {
    return EventBus.subscribe(COMMAND_ID.subscription.markAllAsRead, () => {
      let cancel = false
      const undo = () => {
        toast.dismiss(id)
        if (cancel) return
        cancel = true
      }
      const routerParams = getRouteParams()
      const id = toast.warning("", {
        description: <ConfirmMarkAllReadInfo undo={undo} />,
        duration: 3000,
        onAutoClose() {
          if (cancel) return
          markAllByRoute(undefined, routerParams)
        },
        action: {
          label: (
            <span className="flex items-center gap-1">
              {t("mark_all_read_button.undo")}
              <Kbd className="border-border inline-flex items-center border bg-transparent text-white">
                $mod+z
              </Kbd>
            </span>
          ),
          onClick: undo,
        },
      })
    })
  }, [t])

  const markAllAsReadShortcut = useCommandShortcuts()[COMMAND_ID.subscription.markAllAsRead]
  return (
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
              <KbdCombined className="text-text-secondary">{markAllAsReadShortcut}</KbdCombined>
            </div>
          )}
        </>
      }
      className={className}
      ref={ref}
      onClick={() => {
        markAllByRoute()
      }}
    >
      <i className="i-mgc-check-circle-cute-re" />
    </ActionButton>
  )
}

const ConfirmMarkAllReadInfo = ({ undo }: { undo: () => any }) => {
  const { t } = useTranslation()
  const [countdown] = useCountdown({ countStart: 3 })

  useHotkeys("ctrl+z,meta+z", undo, {
    preventDefault: true,
  })

  return (
    <div className="text-text flex flex-col">
      <span>{t("mark_all_read_button.confirm_mark_all_info")}</span>
      <span className="text-text-secondary">
        {t("mark_all_read_button.auto_confirm_info", { countdown })}
      </span>
    </div>
  )
}

export const FlatMarkAllReadButton: FC<
  MarkAllButtonProps & {
    filter?: MarkAllFilter
    buttonClassName?: string
    iconClassName?: string
    text?: string
  }
> = (props) => {
  const t = useI18n()

  const { className, filter, which, buttonClassName, iconClassName } = props
  const [status, setStatus] = useState<"initial" | "confirm" | "done">("initial")

  const animate = {
    initial: { rotate: -30, opacity: 0.9 },
    exit: { rotate: -30, opacity: 0.9 },
    animate: { rotate: 0, opacity: 1 },
  }
  return (
    <Button
      variant="ghost"
      disabled={status === "done"}
      buttonClassName={buttonClassName}
      textClassName={cn(
        "center relative flex h-auto gap-1",

        className,
      )}
      onClick={() => {
        markAllByRoute(filter)
          .then(() => setStatus("done"))
          .catch(() => setStatus("initial"))
      }}
    >
      <i key={2} {...animate} className={cn("i-mgc-check-circle-cute-re", iconClassName)} />
      <span className="duration-200">
        {status === "done" ? (
          t("mark_all_read_button.done")
        ) : (
          <Trans
            i18nKey="mark_all_read_button.mark_as_read"
            components={{
              which: (
                <>{typeof which === "string" ? t.common(`words.which.${which}` as any) : which}</>
              ),
            }}
          />
        )}
      </span>
    </Button>
  )
}
