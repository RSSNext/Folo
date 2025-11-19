import { Spring } from "@follow/components/constants/spring.js"
import { Folo } from "@follow/components/icons/folo.js"
import { Logo } from "@follow/components/icons/logo.jsx"
import { LetsIconsResizeDownRightLight } from "@follow/components/icons/resize.jsx"
import { IN_ELECTRON } from "@follow/shared/constants"
import { useIsLoggedIn } from "@follow/store/user/hooks"
import { preventDefault } from "@follow/utils/dom"
import { cn, getOS } from "@follow/utils/utils"
import { atom, useAtomValue, useSetAtom } from "jotai"
import type { BoundingBox } from "motion/react"
import { Resizable } from "re-resizable"
import type { PropsWithChildren } from "react"
import { memo, Suspense, use, useCallback, useMemo, useRef } from "react"
import { createPortal } from "react-dom"

import { useUISettingSelector } from "~/atoms/settings/ui"
import { m } from "~/components/common/Motion"
import { resizableOnly } from "~/components/ui/modal"
import { useModalResizeAndDrag } from "~/components/ui/modal/stacked/internal/use-drag"
import { ElECTRON_CUSTOM_TITLEBAR_HEIGHT } from "~/constants"
import { useRequireLogin } from "~/hooks/common/useRequireLogin"
import { useUpgradePlanModal } from "~/modules/plan"

import { isGuestAccessibleSettingTab, SETTING_MODAL_ID } from "../constants"
import { EnhancedSettingsIndicator } from "../helper/EnhancedIndicator"
import { SettingSyncIndicator } from "../helper/SyncIndicator"
import { useAvailableSettings, useSettingPageContext } from "../hooks/use-setting-ctx"
import { SettingsSidebarTitle } from "../title"
import type { SettingPageConfig } from "../utils"
import { DisableWhy } from "../utils"
import { SettingModalContentPortalableContext, useSetSettingTab, useSettingTab } from "./context"
import { defaultCtx, SettingContext } from "./hooks"

export function SettingModalLayout(props: PropsWithChildren) {
  const { children } = props

  const elementRef = useRef<HTMLDivElement>(null)
  const edgeElementRef = useRef<HTMLDivElement>(null)
  const {
    handleDrag,
    handleResizeStart,
    handleResizeStop,
    preferDragDir,
    isResizeable,
    resizeableStyle,

    dragController,
  } = useModalResizeAndDrag(elementRef, {
    resizeable: true,
    draggable: true,
  })

  const { draggable, overlay } = useUISettingSelector((state) => ({
    draggable: state.modalDraggable,
    overlay: state.modalOverlay,
  }))

  const measureDragConstraints = useRef((constraints: BoundingBox) => {
    if (getOS() === "Windows") {
      return {
        ...constraints,
        top: constraints.top + ElECTRON_CUSTOM_TITLEBAR_HEIGHT,
      }
    }
    return constraints
  }).current

  const portalableCtxValue = useMemo(() => {
    return atom(null as any)
  }, [])

  return (
    <div
      id={SETTING_MODAL_ID}
      className={cn("h-full", !isResizeable && "center")}
      ref={edgeElementRef}
    >
      <m.div
        exit={{
          opacity: 0,
          scale: 0.96,
        }}
        transition={Spring.presets.smooth}
        className={cn(
          "relative flex overflow-hidden rounded-xl rounded-br-none border border-border",
          !overlay && "shadow-modal",
        )}
        style={resizeableStyle}
        onContextMenu={preventDefault}
        drag={draggable && (preferDragDir || draggable)}
        dragControls={dragController}
        dragListener={false}
        dragMomentum={false}
        dragElastic={false}
        dragConstraints={edgeElementRef}
        onMeasureDragConstraints={measureDragConstraints}
        whileDrag={{
          cursor: "grabbing",
        }}
      >
        {/* eslint-disable-next-line @eslint-react/no-context-provider */}
        <SettingContext.Provider value={defaultCtx}>
          <Resizable
            onResizeStart={handleResizeStart}
            onResizeStop={handleResizeStop}
            enable={resizableOnly("bottomRight")}
            defaultSize={{
              width: 950,
              height: 800,
            }}
            maxHeight="90vh"
            minHeight={400}
            minWidth={700}
            maxWidth="95vw"
            className="flex !select-none flex-col"
          >
            {draggable && (
              <div className="absolute inset-x-0 top-0 z-[1] h-8" onPointerDown={handleDrag} />
            )}
            <div className="flex h-0 flex-1" ref={elementRef}>
              <div className="flex min-h-0 min-w-44 max-w-[20ch] flex-col rounded-l-xl border-r border-r-border bg-sidebar px-2 py-6 backdrop-blur-background">
                <div className="mb-4 flex h-8 items-center gap-2 px-2 font-bold">
                  <Logo className="mr-1 size-6" />

                  <Folo className="size-8" />
                </div>
                <nav className="flex grow flex-col">
                  <SidebarItems />
                </nav>

                <div className="relative -mb-6 flex h-8 shrink-0 items-center justify-end gap-2">
                  <EnhancedSettingsIndicator />
                  <SettingSyncIndicator />
                </div>
              </div>
              <div className="relative flex h-full min-w-0 flex-1 flex-col bg-background pt-1">
                <SettingModalContentPortalableContext value={portalableCtxValue}>
                  <Suspense>{children}</Suspense>
                  <SettingModalContentPortalable />
                </SettingModalContentPortalableContext>
              </div>
            </div>

            <LetsIconsResizeDownRightLight className="pointer-events-none absolute bottom-0 right-0 size-6 translate-x-px translate-y-px text-border" />
          </Resizable>
        </SettingContext.Provider>
      </m.div>
    </div>
  )
}

const SettingModalContentPortalable = () => {
  const setElement = useSetAtom(use(SettingModalContentPortalableContext))
  return <div ref={setElement as any} />
}

const SettingItemButtonImpl = (props: {
  setTab: (tab: string) => void
  item: SettingPageConfig
  path: string
  isActive: boolean
  onChange?: (tab: string) => void
  guestLocked?: boolean
}) => {
  const { setTab, item, path, onChange, isActive, guestLocked = false } = props
  const { disableIf } = item

  const ctx = useSettingPageContext()
  const { ensureLogin } = useRequireLogin()

  const [disabledByConfig, whyFromConfig = DisableWhy.Noop] = disableIf?.(ctx) || [
    false,
    DisableWhy.Noop,
  ]
  const disabled = guestLocked || disabledByConfig
  const why = disabledByConfig ? whyFromConfig : DisableWhy.Noop
  const presentActivationModal = useUpgradePlanModal()

  return (
    <button
      className={cn(
        "my-0.5 flex w-full items-center rounded-lg px-2.5 py-0.5 leading-loose text-text",
        isActive && "!bg-theme-item-active !text-text",
        !IN_ELECTRON && "duration-200 hover:bg-theme-item-hover",
        disabled && "opacity-50",
        disabledByConfig && "cursor-not-allowed",
      )}
      type="button"
      onClick={useCallback(() => {
        if (guestLocked) {
          ensureLogin()
          return
        }
        if (disabled) {
          switch (why) {
            case DisableWhy.NotActivation: {
              presentActivationModal()
              return
            }
            case DisableWhy.Noop: {
              break
            }
          }
        }
        setTab(path)
        onChange?.(path)
      }, [disabled, ensureLogin, guestLocked, onChange, path, presentActivationModal, setTab, why])}
    >
      <SettingsSidebarTitle path={path} className="text-[0.94rem] font-medium" />
    </button>
  )
}

const SettingItemButton = memo(SettingItemButtonImpl)

export const SidebarItems = memo((props: { onChange?: (tab: string) => void }) => {
  const { onChange } = props
  const setTab = useSetSettingTab()
  const tab = useSettingTab()
  const availableSettings = useAvailableSettings()
  const isLoggedIn = useIsLoggedIn()

  return availableSettings.map((t) => {
    const isActive = tab === t.path
    const guestLocked = !isLoggedIn && !isGuestAccessibleSettingTab(t.path)
    return (
      <SettingItemButton
        key={t.path}
        isActive={isActive}
        setTab={setTab}
        item={t}
        path={t.path}
        onChange={onChange}
        guestLocked={guestLocked}
      />
    )
  })
})

export const SettingModalContentPortal: Component = ({ children }) => {
  const element = useAtomValue(use(SettingModalContentPortalableContext))
  return createPortal(children, element)
}
