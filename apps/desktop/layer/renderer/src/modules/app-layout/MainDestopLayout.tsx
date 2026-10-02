import { RootPortal } from "@follow/components/ui/portal/index.jsx"
import { IN_ELECTRON, PROD } from "@follow/shared/constants"
import { useWhoami } from "@follow/store/user/hooks"
import { preventDefault } from "@follow/utils/dom"
import type { PropsWithChildren } from "react"
import * as React from "react"
import { Suspense, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Outlet } from "react-router"

import { setMainContainerElement, setRootContainerElement } from "~/atoms/dom"
import { useUISettingKey } from "~/atoms/settings/ui"
import { useLoginModalShow } from "~/atoms/user"
import { AppErrorBoundary } from "~/components/common/AppErrorBoundary"
import { ErrorComponentType } from "~/components/errors/enum"
import { PlainModal, PlainWithAnimationModal } from "~/components/ui/modal/stacked/custom-modal"
import { DeclarativeModal } from "~/components/ui/modal/stacked/declarative-modal"
import { ROOT_CONTAINER_ID } from "~/constants/dom"
import { getI18n } from "~/i18n"
import { EnvironmentIndicator } from "~/modules/app/EnvironmentIndicator"
import { LoginModalContent } from "~/modules/auth/LoginModalContent"
import { DebugRegistry } from "~/modules/debug/registry"
import { EntriesProvider } from "~/modules/entry-column/context/EntriesContext"
import { CmdF } from "~/modules/panel/cmdf"
import { SearchCmdK } from "~/modules/panel/cmdk"
import { CmdNTrigger } from "~/modules/panel/cmdn"
import { AppNotificationContainer } from "~/modules/upgrade/lazy/index"

import { SubscriptionColumnContainer } from "./subscription-column/SubscriptionColumn"

const errorTypes = [
  ErrorComponentType.Page,
  ErrorComponentType.FeedFoundCanBeFollow,
  ErrorComponentType.FeedNotFound,
] as ErrorComponentType[]

/**
 * MainDestopLayout Component
 *
 * The main desktop layout that serves as the primary container for the Follow application.
 * This layout is responsible for:
 * - Providing the root layout structure with subscription sidebar and main content area
 * - Handling authentication states and displaying login modals
 * - Managing error boundaries for critical app errors
 * - Rendering app-wide panels (search, commands, notifications)
 *
 * ## Layout Scenarios
 *
 * ### Scenario 1: Timeline View (/timeline/1/feed-123/entry-456)
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ MainDestopLayout                                                │
 * ├─────────────┬───────────────────────────────────────────────────┤
 * │ Subscription│ TimelineEntryTwoColumnLayout                      │
 * │ Column      ├─────────────────┬─────────────────────────────────┤
 * │             │ EntryColumn     │ EntryContentView                │
 * │ ┌─────────┐ │ ┌─────────────┐ │ ┌─────────────────────────────┐ │
 * │ │ Feeds   │ │ │ Entry List  │ │ │ Article Content             │ │
 * │ │ - Tech  │ │ │ - Article 1 │ │ │                             │ │
 * │ │ - News  │ │ │ - Article 2 │ │ │ # Article Title             │ │
 * │ │ - Blog  │ │ │ - Article 3 │ │ │ Article content here...     │ │
 * │ └─────────┘ │ └─────────────┘ │ └─────────────────────────────┘ │
 * └─────────────┴─────────────────┴─────────────────────────────────┘
 * ```
 *
 * ### Scenario 2: Discover Page (/discover)
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ MainDestopLayout                                                │
 * ├─────────────┬───────────────────────────────────────────────────┤
 * │ Subscription│ SubviewLayout (Full-screen Modal)                 │
 * │ Column      │ ┌─────────────────────────────────────────────────┐ │
 * │             │ │ ◄ Back    Discover Feeds    [Import] [Add] │ │
 * │ ┌─────────┐ │ ├─────────────────────────────────────────────────┤ │
 * │ │ Feeds   │ │ │                                             │ │
 * │ │ - Tech  │ │ │        🔍 Search for feeds...               │ │
 * │ │ - News  │ │ │                                             │ │
 * │ │ - Blog  │ │ │ ┌─────────┐ ┌─────────┐ ┌─────────┐         │ │
 * │ └─────────┘ │ │ │ Tech    │ │ News    │ │ Design  │         │ │
 * │             │ │ │ Feeds   │ │ Sources │ │ Blogs   │         │ │
 * │             │ │ └─────────┘ └─────────┘ └─────────┘         │ │
 * │             │ └─────────────────────────────────────────────────┘ │
 * └─────────────┴───────────────────────────────────────────────────┘
 * ```
 *
 * ### Scenario 3: AI Chat (/ai)
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ MainDestopLayout                                                │
 * ├─────────────┬───────────────────────────────────────────────────┤
 * │ Subscription│ AIChatLayout                                      │
 * │ Column      │ ┌─────────────────────────────────────────────────┐ │
 * │             │ │ 🤖 AI Assistant                             ⚙️ │ │
 * │ ┌─────────┐ │ ├─────────────────────────────────────────────────┤ │
 * │ │ Feeds   │ │ │ 💬 How can I help you today?                   │ │
 * │ │ - Tech  │ │ │                                             │ │
 * │ │ - News  │ │ │ 👤 Summarize my latest tech articles        │ │
 * │ │ - Blog  │ │ │                                             │ │
 * │ └─────────┘ │ │ 🤖 Here's a summary of your recent tech...  │ │
 * │             │ │                                             │ │
 * │             │ ├─────────────────────────────────────────────────┤ │
 * │             │ │ Type a message... [📎] [🎙️] [📤]            │ │
 * │             │ └─────────────────────────────────────────────────┘ │
 * └─────────────┴───────────────────────────────────────────────────┘
 * ```
 *
 * ### Scenario 4: Default View (/) - Timeline Home
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ MainDestopLayout                                                │
 * ├─────────────┬───────────────────────────────────────────────────┤
 * │ Subscription│ Default Timeline (All Feeds)                      │
 * │ Column      │ ┌─────────────────────────────────────────────────┐ │
 * │             │ │ 📰 All Articles                             ⚙️ │ │
 * │ ┌─────────┐ │ ├─────────────────────────────────────────────────┤ │
 * │ │ 📌 Today │ │ │ [Tech Blog] New React Features              │ │
 * │ │ ⭐ Starred │ │ │ [News Site] Breaking: AI Breakthrough      │ │
 * │ │ 📚 All   │ │ │ [Design Blog] UI Trends 2024               │ │
 * │ │         │ │ │ [Tech News] JavaScript Updates              │ │
 * │ │ Feeds:  │ │ │ [Blog] How to Build Better Apps            │ │
 * │ │ • Tech  │ │ │                                             │ │
 * │ │ • News  │ │ │ Load more articles...                       │ │
 * │ │ • Design│ │ │                                             │ │
 * │ └─────────┘ │ └─────────────────────────────────────────────────┘ │
 * └─────────────┴───────────────────────────────────────────────────┘
 * ```
 *
 * ## Router Outlet Flow
 * The `<Outlet />` in this component renders different child layouts based on the current route:
 * - `/` → Default timeline view
 * - `/timeline/*` → TimelineEntryTwoColumnLayout (two-column feed reader)
 * - `/discover` → SubviewLayout (full-screen discovery)
 * - `/ai` → AIChatLayout (AI chat interface)
 * - `/power`, `/action`, `/rsshub` → SubviewLayout (utility pages)
 *
 * @component
 * @example
 * // This component is automatically rendered by React Router
 * // based on the route configuration in generated-routes.ts
 */
export function MainDestopLayout() {
  const { t } = useTranslation()
  const isAuthFail = useLoginModalShow()
  const user = useWhoami()

  const containerRef = useRef<HTMLDivElement | null>(null)

  // const { shouldShowNewUserGuide } = useNewUserGuideState()
  // // Auto-trigger new user guide modal
  // useEffect(() => {
  //   if (!shouldShowNewUserGuide) return

  //   import("~/modules/app-tip/AppTipModalContent").then((m) => {
  //     window.presentModal({
  //       title: getI18n().t("new_user_dialog.title"),
  //       content: ({ dismiss }) => (
  //         <m.AppTipModalContent
  //           onClose={() => {
  //             dismiss()
  //           }}
  //         />
  //       ),
  //       CustomModalComponent: PlainWithAnimationModal,
  //       modalContainerClassName: "flex items-center justify-center",
  //       modalClassName: "w-full max-w-5xl",
  //       canClose: false,
  //       clickOutsideToDismiss: false,
  //       overlay: false,
  //     })
  //   })
  // }, [shouldShowNewUserGuide])

  return (
    <RootContainer ref={containerRef}>
      {!PROD && <EnvironmentIndicator />}

      <Suspense>
        <AppNotificationContainer />
      </Suspense>

      <EntriesProvider>
        <SubscriptionColumnContainer />

        <main
          ref={setMainContainerElement}
          className="flex min-w-0 flex-1 bg-theme-background pt-[calc(var(--fo-window-padding-top)_-10px)] !outline-none"
          // NOTE: tabIndex for main element can get by `document.activeElement`
          tabIndex={-1}
        >
          <AppErrorBoundary errorType={errorTypes}>
            <Outlet />
          </AppErrorBoundary>
        </main>
      </EntriesProvider>

      {isAuthFail && !user && (
        <RootPortal>
          <DeclarativeModal
            id="login"
            defaultOpen
            CustomModalComponent={PlainModal}
            overlay
            title={t("words.login")}
            canClose={true}
            clickOutsideToDismiss={true}
          >
            <LoginModalContent canClose={true} runtime={IN_ELECTRON ? "app" : "browser"} />
          </DeclarativeModal>
        </RootPortal>
      )}

      <SearchCmdK />
      <CmdNTrigger />
      {IN_ELECTRON && <CmdF />}
    </RootContainer>
  )
}

/**
 * RootContainer Component
 *
 * The root container wrapper that:
 * - Sets up CSS custom properties for layout dimensions
 * - Provides the base container styling and dimensions
 * - Manages DOM element references for the layout system
 * - Handles context menu prevention and responsive behavior
 *
 * @param ref - Ref forwarded to the root div element
 * @param children - Child components to render within the container
 * @component
 */
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

DebugRegistry.add("App Tip Dialog", () => {
  import("~/modules/app-tip/AppTipModalContent").then((m) => {
    window.presentModal({
      title: getI18n().t("app_tip.title"),
      content: () => <m.AppTipModalContent />,
      CustomModalComponent: PlainWithAnimationModal,
      modalContainerClassName: "flex items-center justify-center",
      modalClassName: "w-full max-w-5xl",
      canClose: true,
      clickOutsideToDismiss: false,
      overlay: false,
    })
  })
})

DebugRegistry.add("AI Onboarding", () => {
  import("~/modules/ai-onboarding/ai-onboarding-modal-content").then((m) => {
    window.presentModal({
      title: getI18n().t("new_user_guide.title"),
      content: ({ dismiss }) => (
        <m.AiOnboardingModalContent
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
