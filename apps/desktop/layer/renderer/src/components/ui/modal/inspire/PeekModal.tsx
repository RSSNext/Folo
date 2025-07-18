import { getStableRouterNavigate } from "@follow/components/atoms/route.js"
import { RootPortalContext } from "@follow/components/ui/portal/provider.js"
import type { PropsWithChildren, ReactNode } from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { m } from "~/components/common/Motion"
import { GlassButton } from "~/components/ui/button/GlassButton"

import { FixedModalCloseButton } from "../components/close"
import { useCurrentModal, useModalStack } from "../stacked/hooks"
import { InPeekModal } from "./InPeekModal"

export const PeekModal = (
  props: PropsWithChildren<{
    to?: string
    rightActions?: {
      onClick: () => void
      label: string
      icon: ReactNode
    }[]
  }>,
) => {
  const { dismissAll } = useModalStack()

  const { to, children } = props
  const { t } = useTranslation("common")
  const { dismiss } = useCurrentModal()
  const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null)

  return (
    <RootPortalContext value={rootRef as HTMLElement}>
      <div
        className="scrollbar-none relative mx-auto mt-[10vh] max-w-full overflow-hidden px-2 lg:max-w-[65rem] lg:p-0"
        ref={setRootRef}
      >
        <m.div
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.2 }}
          className="motion-preset-slide-up motion-duration-200 motion-ease-spring-smooth scrollbar-none overflow-hidden"
        >
          <InPeekModal value={true}>{children}</InPeekModal>
        </m.div>
        <m.div
          initial={true}
          exit={{
            opacity: 0,
          }}
          className="safe-inset-top-4 fixed right-4 flex items-center gap-4"
        >
          {props.rightActions?.map((action) => (
            <GlassButton
              key={action.label}
              onClick={action.onClick}
              description={action.label}
              size="md"
              variant="flat"
            >
              {action.icon}
            </GlassButton>
          ))}
          {!!to && (
            <GlassButton
              onClick={() => {
                dismissAll()

                getStableRouterNavigate()?.(to)
              }}
              description={t("words.expand")}
              size="md"
              variant="flat"
            >
              <i className="i-mgc-fullscreen-2-cute-re text-lg" />
            </GlassButton>
          )}
          <FixedModalCloseButton onClick={dismiss} />
        </m.div>
      </div>
    </RootPortalContext>
  )
}
