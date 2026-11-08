import { Button } from "@follow/components/ui/button/index.js"
import { InputV2 } from "@follow/components/ui/input/index.js"
import { useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { ipcServices } from "~/lib/client"
import { notionStatusQueryKey, useNotionStatus } from "~/modules/integration/notion-status"

export const NotionSettings = () => {
  const { t } = useTranslation("settings")
  const queryClient = useQueryClient()
  const status = useNotionStatus()
  // Credentials are transient and are never included in settings sync or export.
  const [token, setToken] = useState("")
  const [dataSourceId, setDataSourceId] = useState("")
  const [busy, setBusy] = useState(false)
  const pendingRef = useRef(false)

  const update = async (disconnect: boolean) => {
    if (pendingRef.current) return
    pendingRef.current = true
    setBusy(true)
    try {
      const services = ipcServices
      if (!services) throw new Error("Desktop integration unavailable")
      if (disconnect) {
        await services.notion.disconnect()
      } else {
        await services.notion.configure({
          token: token.trim(),
          dataSourceId: dataSourceId.trim(),
        })
      }
      setToken("")
      setDataSourceId("")
      await queryClient.invalidateQueries({ queryKey: notionStatusQueryKey })
      toast.success(
        t(disconnect ? "integration.notion.disconnected" : "integration.notion.connected"),
      )
    } catch {
      // Do not display arbitrary provider errors, which may contain request data.
      toast.error(t("integration.notion.failed"))
    } finally {
      setToken("")
      pendingRef.current = false
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 py-4">
      <p className="text-sm text-text-secondary">{t("integration.notion.description")}</p>
      <a
        href="https://www.notion.so/profile/integrations"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm underline"
      >
        {t("integration.notion.create_integration")}
      </a>
      {status.isError && (
        <p role="alert" className="text-sm text-red">
          {t("integration.notion.status_failed")}
        </p>
      )}
      {status.data?.configured && (
        <p className="break-all text-sm text-text-secondary">
          {t("integration.notion.target", { id: status.data.dataSourceId })}
        </p>
      )}
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          void update(false)
        }}
      >
        <label className="flex flex-col gap-2 text-sm">
          {t("integration.notion.token")}
          <InputV2
            type="password"
            autoComplete="off"
            value={token}
            disabled={busy}
            onChange={(event) => setToken(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          {t("integration.notion.data_source")}
          <InputV2
            value={dataSourceId}
            disabled={busy}
            autoComplete="off"
            onChange={(event) => setDataSourceId(event.target.value)}
          />
        </label>
        <p className="text-xs text-text-tertiary">{t("integration.notion.permissions")}</p>
        <div className="flex gap-2">
          <Button type="submit" disabled={busy || !token.trim() || !dataSourceId.trim()}>
            {t("integration.notion.connect")}
          </Button>
          {status.data?.configured && (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void update(true)}
            >
              {t("integration.notion.disconnect")}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
