import { getStableRouterNavigate } from "@follow/components/atoms/route.js"
import { RootPortalProvider } from "@follow/components/ui/portal/provider.js"
import type { PropsWithChildren, ReactNode } from "react"
import { createContext, useContext, useState } from "react"
import { useTranslation } from "react-i18next"

import { m } from "~/components/common/Motion"

import { PeekModalBaseButton } from "../components/base"
import { FixedModalCloseButton } from "../components/close"
import { useCurrentModal, useModalStack } from "../stacked/hooks"

const InPeekModal = createContext(false)
export const useInPeekModal = () => useContext(InPeekModal)
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
    <RootPortalProvider value={rootRef as HTMLElement}>
      <div
        className="scrollbar-none relative mx-auto mt-[10vh] max-w-full overflow-auto px-2 lg:max-w-[65rem] lg:p-0"
        ref={setRootRef}
      >
        <m.div
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.2 }}
          className="motion-preset-slide-up motion-duration-200 motion-ease-spring-smooth scrollbar-none overflow-hidden"
        >
          <InPeekModal.Provider value={true}>{children}</InPeekModal.Provider>
        </m.div>
        <m.div
          initial={true}
          exit={{
            opacity: 0,
          }}
          className="safe-inset-top-4 fixed right-4 flex items-center gap-4"
        >
          {props.rightActions?.map((action) => (
            <PeekModalBaseButton
              key={action.label}
              onClick={action.onClick}
              label={action.label}
              icon={action.icon}
            />
          ))}
          {!!to && (
            <PeekModalBaseButton
              onClick={() => {
                dismissAll()

                getStableRouterNavigate()?.(to)
              }}
              label={t("words.expand")}
              icon={<i className="i-mgc-fullscreen-2-cute-re text-lg" />}
            />
          )}
          <FixedModalCloseButton onClick={dismiss} />
        </m.div>
      </div>
    </RootPortalProvider>
  )
}
