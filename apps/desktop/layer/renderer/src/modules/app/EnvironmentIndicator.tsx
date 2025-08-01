/* eslint-disable @eslint-react/dom/no-missing-iframe-sandbox */
import { Button } from "@follow/components/ui/button/index.js"
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

import { PlainModal } from "~/components/ui/modal/stacked/custom-modal"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"

import { DebugRegistry } from "../debug/registry"

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

            const actionMap = DebugRegistry.getAll()

            present({
              title: "Debug Actions",
              content: () => {
                return (
                  <div className="flex flex-col gap-2">
                    {Object.entries(actionMap).map(([key, action]) => {
                      return (
                        <div key={key} className="flex w-full items-center gap-2">
                          <span className="flex flex-1">{key}</span>
                          <Button variant="outline" type="button" onClick={() => action()}>
                            <i className="i-mgc-play-cute-fi size-3" />
                            <span className="ml-1">Run</span>
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )
              },
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
