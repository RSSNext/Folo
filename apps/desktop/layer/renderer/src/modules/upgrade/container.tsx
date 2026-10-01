import { useOnce } from "@follow/hooks"
import { nextFrame } from "@follow/utils/dom"
import { getStorageNS } from "@follow/utils/ns"
import { repository } from "@pkg"
import type { FC } from "react"
import { Suspense, use, useEffect, useRef } from "react"
import { Trans, useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useServerConfigs } from "~/atoms/server-configs"
import { Markdown } from "~/components/ui/markdown/Markdown"
import { PeekModal } from "~/components/ui/modal/inspire/PeekModal"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { Paper } from "~/components/ui/paper"
import { DebugRegistry } from "~/modules/debug/registry"

import { getDesktopReleaseUrl, linkifyChangelog } from "./utils"

const AppNotificationContainer: FC = () => {
  const { t } = useTranslation()
  const { present } = useModalStack()

  const serverConfigs = useServerConfigs()

  const onceRef = useRef(false)
  useEffect(() => {
    if (onceRef.current) return

    if (!serverConfigs?.ANNOUNCEMENT) return
    onceRef.current = true
    try {
      const payload = JSON.parse(serverConfigs.ANNOUNCEMENT) as {
        title: string
        id: number | string
        content: string
      }

      if (payload.id) {
        const storeKey = getStorageNS(`announcement-${payload.id}`)

        const showPrevious = localStorage.getItem(storeKey)
        if (showPrevious) {
          return
        }
        localStorage.setItem(storeKey, payload.id.toString())
      }

      toast.info(payload.title, {
        description: <Markdown className="text-sm">{payload.content}</Markdown>,
        duration: Infinity,
        closeButton: true,
      })
    } catch (e) {
      console.error(e)
    }
  }, [serverConfigs?.ANNOUNCEMENT])

  useOnce(() => {
    const toaster = () => {
      toast.success("", {
        description: (
          <div className="font-medium text-text">
            <Trans
              t={t}
              i18nKey="notify.app_upgraded"
              values={{ version: APP_VERSION }}
              components={{
                Link: (
                  <a
                    href={getDesktopReleaseUrl(repository.url, APP_VERSION)}
                    target="_blank"
                    rel="noreferrer"
                  />
                ),
              }}
            />
          </div>
        ),
        closeButton: true,
        duration: 5000,
        action: CHANGELOG_CONTENT
          ? {
              label: t("notify.whats_new"),
              onClick: () => {
                nextFrame(() => {
                  present({
                    clickOutsideToDismiss: true,
                    title: t("notify.whats_new"),
                    autoFocus: false,
                    modalClassName:
                      "relative mx-auto mt-[10vh] scrollbar-none max-w-full overflow-auto px-2 lg:max-w-[65rem] lg:p-0",

                    CustomModalComponent: ({ children }) => {
                      return <PeekModal>{children}</PeekModal>
                    },
                    content: () => (
                      <Suspense>
                        <Changelog />
                      </Suspense>
                    ),
                    overlay: true,
                  })
                })
              },
            }
          : undefined,
      })
    }
    if (window.__app_is_upgraded__) {
      setTimeout(toaster)
    }

    DebugRegistry.add("App Upgraded Toast", toaster)
  })

  return null
}
export default AppNotificationContainer

const changelogContext = (async () => {
  const repoUrl = repository.url
  if (import.meta.env.DEV) {
    const content = await import("../../../../../changelog/next.md?raw").then((m) => m.default)
    return linkifyChangelog(content, repoUrl)
  }
  return linkifyChangelog(CHANGELOG_CONTENT, repoUrl)
})()
const Changelog = () => (
  <Paper>
    <Markdown className="mt-8 w-full max-w-full">{use(changelogContext)}</Markdown>
  </Paper>
)
