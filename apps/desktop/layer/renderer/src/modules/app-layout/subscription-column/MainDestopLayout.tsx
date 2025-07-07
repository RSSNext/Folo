import { RootPortal } from "@follow/components/ui/portal/index.jsx"
import { DEV, IN_ELECTRON, PROD } from "@follow/shared/constants"
import { useWhoami } from "@follow/store/user/hooks"
import { preventDefault } from "@follow/utils/dom"
import type { PropsWithChildren } from "react"
import * as React from "react"
import { Suspense, useRef, useState } from "react"
import { Outlet } from "react-router"

import { setMainContainerElement, setRootContainerElement } from "~/atoms/dom"
import { useUISettingKey } from "~/atoms/settings/ui"
import { useLoginModalShow } from "~/atoms/user"
import { AppErrorBoundary } from "~/components/common/AppErrorBoundary"
import { ErrorComponentType } from "~/components/errors/enum"
import { PlainModal } from "~/components/ui/modal/stacked/custom-modal"
import { DeclarativeModal } from "~/components/ui/modal/stacked/declarative-modal"
import { ROOT_CONTAINER_ID } from "~/constants/dom"
import { EnvironmentIndicator } from "~/modules/app/EnvironmentIndicator"
import { LoginModalContent } from "~/modules/auth/LoginModalContent"
import { DebugRegistry } from "~/modules/debug/registry"
import { CmdF } from "~/modules/panel/cmdf"
import { SearchCmdK } from "~/modules/panel/cmdk"
import { CmdNTrigger } from "~/modules/panel/cmdn"
import { AppNotificationContainer } from "~/modules/upgrade/lazy/index"

import { NewUserGuide } from "./components/NewUserGuide"
import { SubscriptionColumnContainer } from "./SubscriptionColumn"

const errorTypes = [
  ErrorComponentType.Page,
  ErrorComponentType.FeedFoundCanBeFollow,
  ErrorComponentType.FeedNotFound,
] as ErrorComponentType[]

export function MainDestopLayout() {
  const isAuthFail = useLoginModalShow()
  const user = useWhoami()

  const containerRef = useRef<HTMLDivElement | null>(null)

  return (
    <RootContainer ref={containerRef}>
      {!PROD && <EnvironmentIndicator />}

      <Suspense>
        <AppNotificationContainer />
      </Suspense>

      <SubscriptionColumnContainer />

      <main
        ref={setMainContainerElement}
        className="bg-theme-background flex min-w-0 flex-1 pt-[calc(var(--fo-window-padding-top)_-10px)] !outline-none"
        // NOTE: tabIndex for main element can get by `document.activeElement`
        tabIndex={-1}
      >
        <AppErrorBoundary errorType={errorTypes}>
          <Outlet />
        </AppErrorBoundary>
      </main>

      <NewUserGuide />

      {isAuthFail && !user && (
        <RootPortal>
          <DeclarativeModal
            id="login"
            CustomModalComponent={PlainModal}
            open
            overlay
            title="Login"
            canClose={false}
            clickOutsideToDismiss={false}
          >
            <LoginModalContent canClose={false} runtime={IN_ELECTRON ? "app" : "browser"} />
          </DeclarativeModal>
        </RootPortal>
      )}

      <SearchCmdK />
      <CmdNTrigger />
      {ELECTRON && <CmdF />}
    </RootContainer>
  )
}

const RootContainer = ({
  ref,
  children,
}: PropsWithChildren & { ref?: React.Ref<HTMLDivElement | null> }) => {
  const feedColWidth = useUISettingKey("feedColWidth")

  const [elementRef, _setElementRef] = useState<HTMLDivElement | null>(null)
  const setElementRef = React.useCallback((el: HTMLDivElement | null) => {
    _setElementRef(el)
    setRootContainerElement(el)
  }, [])
  React.useImperativeHandle(ref, () => elementRef!)
  return (
    <div
      ref={setElementRef}
      style={
        {
          "--fo-feed-col-w": `${feedColWidth}px`,
        } as any
      }
      className="relative z-0 flex h-screen overflow-hidden print:h-auto print:overflow-auto"
      onContextMenu={preventDefault}
      id={ROOT_CONTAINER_ID}
    >
      {children}
    </div>
  )
}

if (DEV) {
  DebugRegistry.add("New User Guide", () => {
    import("~/modules/new-user-guide/guide-modal-content").then((m) => {
      window.presentModal({
        title: "New User Guide",
        content: ({ dismiss }) => (
          <m.GuideModalContent
            onClose={() => {
              dismiss()
            }}
          />
        ),

        CustomModalComponent: PlainModal,
        modalContainerClassName: "flex items-center justify-center",

        canClose: false,
        clickOutsideToDismiss: false,
        overlay: true,
      })
    })
  })
}
