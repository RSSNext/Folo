/* eslint-disable @eslint-react/dom/no-missing-iframe-sandbox */
import { Button } from "@follow/components/ui/button/index.js"
import { Switch } from "@follow/components/ui/switch/index.jsx"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.jsx"
import { getDBFile } from "@follow/database/db"
import { DEV, MODE } from "@follow/shared/constants"
import { env } from "@follow/shared/env.desktop"
import { useUserRole } from "@follow/store/user/hooks"

import { useDebugFeatureValue, useSetDebugFeatureValue } from "~/atoms/debug-feature"
import { PlainModal } from "~/components/ui/modal/stacked/custom-modal"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { featureConfigMap } from "~/lib/features"

import { DebugRegistry } from "../debug/registry"

const EnvironmentDebugModalContent = () => {
  const actionMap = DebugRegistry.getAll()
  const debugValues = useDebugFeatureValue() as Record<string, boolean>
  const setDebugValues = useSetDebugFeatureValue()

  const overrideEnabled = !!debugValues.__override

  const handleToggleOverride = (checked: boolean) => {
    setDebugValues((prev) => ({ ...(prev as Record<string, boolean>), __override: checked }))
  }

  const handleToggleFeature = (key: string, checked: boolean) => {
    setDebugValues((prev) => ({ ...(prev as Record<string, boolean>), [key]: checked }))
  }

  const featureKeys = Object.keys(featureConfigMap)

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-text text-sm font-medium">Debug override features</div>
          <Switch checked={overrideEnabled} onCheckedChange={handleToggleOverride} />
        </div>
        <p className="text-text-secondary text-xs">
          When enabled, the switches below override server feature flags locally.
        </p>
        <div className="bg-material-medium rounded-md p-2">
          <div className="grid grid-cols-1 gap-2">
            {featureKeys.map((key) => (
              <div key={key} className="flex items-center justify-between rounded-md p-2">
                <span className="text-text text-sm">{key}</span>
                <Switch
                  checked={!!debugValues[key]}
                  onCheckedChange={(v) => handleToggleFeature(key, v)}
                  disabled={!overrideEnabled}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-text text-sm font-medium">Debug actions</div>
        <div className="flex flex-col gap-2">
          {Object.entries(actionMap).map(([key, action]) => (
            <div key={key} className="flex w-full items-center gap-2">
              <span className="flex flex-1">{key}</span>
              <Button variant="outline" type="button" onClick={() => action()}>
                <i className="i-mgc-play-cute-fi size-3" />
                <span className="ml-1">Run</span>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const EnvironmentIndicator = () => {
  const role = useUserRole()
  const { present } = useModalStack()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          tabIndex={-1}
          aria-hidden
          type="button"
          onClick={() => {
            if (!DEV) return

            present({
              title: "Debug Actions",
              content: EnvironmentDebugModalContent,
            })
          }}
        >
          <div className="center bg-folo fixed bottom-0 right-0 z-[99999] flex rounded-tl px-1 py-0.5 text-xs text-white">
            {role}:{DEV && <i className="i-mgc-bug-cute-re size-3" />}
            {MODE}
          </div>
        </button>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent className="max-w-max break-all" side="top">
          <pre>{JSON.stringify({ ...env }, null, 2)}</pre>
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  )
}

if (DEV) {
  const sqliteOnlineWebsite = "https://sqlite-online.vercel.app"

  DebugRegistry.add("SQLite Online", () => {
    window.presentModal({
      title: "SQLite Online",
      content: ({ dismiss }) => (
        <div className="h-full p-16" onClick={dismiss}>
          <iframe
            id="sql-viewer"
            src={sqliteOnlineWebsite}
            className="size-full"
            onLoad={() => {
              const iframe = document.querySelector("#sql-viewer") as HTMLIFrameElement
              if (!iframe) return
              const win = iframe.contentWindow
              if (!win) return

              const eventHandler = (event: MessageEvent) => {
                if (event.origin !== sqliteOnlineWebsite) {
                  console.warn("Blocked message from unauthorized origin:", event.origin)
                  return
                }

                if (event.data.type === "loadDatabaseBufferReady") {
                  getDBFile()
                    .then(async (blob) => {
                      const arrayBuffer = await blob.arrayBuffer()

                      win.postMessage(
                        {
                          type: "invokeLoadDatabaseBuffer",
                          buffer: arrayBuffer,
                        },
                        sqliteOnlineWebsite,
                      )

                      window.removeEventListener("message", eventHandler)
                    })
                    .catch((error) => {
                      console.error("Failed to load database file into SQLite Online", error)
                    })
                }
              }

              window.addEventListener("message", eventHandler)
            }}
          />
        </div>
      ),

      CustomModalComponent: PlainModal,
    })
  })
}
