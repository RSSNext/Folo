import { WindowState } from "@follow/shared/bridge"
import { preventDefault } from "@follow/utils/dom"

import { useWindowState } from "~/atoms/app"
import { useUISettingKey } from "~/atoms/settings/ui"
import { ElECTRON_CUSTOM_TITLEBAR_HEIGHT } from "~/constants"
import { ipcServices } from "~/lib/client"

export const Titlebar = () => {
  const isMaximized = useWindowState() === WindowState.MAXIMIZED

  const feedColWidth = useUISettingKey("feedColWidth")

  return (
    <div
      onContextMenu={preventDefault}
      className="drag-region absolute right-0 flex items-center justify-end overflow-hidden"
      style={{
        height: `${ElECTRON_CUSTOM_TITLEBAR_HEIGHT}px`,
        left: `${feedColWidth}px`,
      }}
    >
      <button
        className="no-drag-region hover:bg-theme-item-active pointer-events-auto flex h-full w-[50px] items-center justify-center duration-200"
        type="button"
        onClick={() => {
          ipcServices?.app.windowAction({ action: "minimize" })
        }}
      >
        <i className="i-mingcute-minimize-line" />
      </button>

      <button
        type="button"
        className="no-drag-region hover:bg-theme-item-active pointer-events-auto flex h-full w-[50px] items-center justify-center duration-200"
        onClick={async () => {
          await ipcServices?.app.windowAction({ action: "maximum" })
        }}
      >
        {isMaximized ? (
          <i className="i-mingcute-restore-line" />
        ) : (
          <i className="i-mingcute-square-line" />
        )}
      </button>

      <button
        type="button"
        className="no-drag-region pointer-events-auto flex h-full w-[50px] items-center justify-center duration-200 hover:bg-red-500 hover:!text-white"
        onClick={() => {
          ipcServices?.app.windowAction({ action: "close" })
        }}
      >
        <i className="i-mingcute-close-line" />
      </button>
    </div>
  )
}
