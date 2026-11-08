import { Button } from "@follow/components/ui/button/index.js"
import { InputV2 } from "@follow/components/ui/input/index.js"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { notionLocalClient } from "~/modules/integration/notion-local"
import { notionStatusQueryKey, useNotionStatus } from "~/modules/integration/notion-status"

export const NotionSettings = () => {
  const { t } = useTranslation("settings")
  const queryClient = useQueryClient()
  const status = useNotionStatus()
  useEffect(
    () => () => {
      void notionLocalClient.cancelSelection().catch(() => {})
    },
    [],
  )
  // Credentials are transient and are never included in settings sync or export.
  const [editing, setEditing] = useState(false)
  const showConnection = !status.data?.configured || editing
  const [token, setToken] = useState("")
  const [sources, setSources] = useState<Array<{
    id: string
    title: string
    databaseId: string
  }> | null>(null)
  const [query, setQuery] = useState("")
  const [appliedQuery, setAppliedQuery] = useState("")
  const [cursor, setCursor] = useState<string | null>(null)
  const picker = async (action: "search" | "more" | "select" | "cancel") => {
    if (pendingRef.current) return
    pendingRef.current = true
    setBusy(true)
    try {
      if (action === "select") {
        await notionLocalClient.selectSource(dataSourceId)
        setEditing(false)
        setSources(null)
        setProperties(null)
        await queryClient.invalidateQueries({ queryKey: notionStatusQueryKey })
      } else if (action === "cancel") {
        await notionLocalClient.cancelSelection()
        setSources(null)
      } else {
        const result = await notionLocalClient.searchSources(
          action === "more" ? appliedQuery : query,
          action === "more" ? cursor || undefined : undefined,
        )
        setSources((current) =>
          action === "more"
            ? [
                ...new Map(
                  [...(current || []), ...result.items].map((item) => [item.id, item]),
                ).values(),
              ]
            : result.items,
        )
        if (action !== "more") setAppliedQuery(query)
        setCursor(result.nextCursor)
        setDataSourceId("")
      }
    } catch {
      toast.error(t("integration.notion.search_failed"))
    } finally {
      pendingRef.current = false
      setBusy(false)
    }
  }
  const [dataSourceId, setDataSourceId] = useState("")
  const [properties, setProperties] = useState<Array<{
    id: string
    name: string
    type: string
  }> | null>(null)
  const [mapping, setMapping] = useState<
    Partial<
      Record<
        "url" | "feedTitle" | "author" | "publishedAt" | "description" | "aiSummary" | "categories",
        string
      >
    >
  >({})
  const mappingAction = async (save: boolean, refresh = false) => {
    if (pendingRef.current) return
    pendingRef.current = true
    setBusy(true)
    try {
      if (save) {
        await notionLocalClient.setMapping(mapping)
        toast.success(t("integration.notion.mapping_saved"))
      } else {
        const result = await notionLocalClient.getMapping()
        setProperties(result.properties)
        if (!refresh) setMapping(result.mapping)
      }
    } catch {
      toast.error(t("integration.notion.mapping_failed"))
    } finally {
      pendingRef.current = false
      setBusy(false)
    }
  }
  const [busy, setBusy] = useState(false)
  const pendingRef = useRef(false)

  const update = async (disconnect: boolean) => {
    if (pendingRef.current) return
    pendingRef.current = true
    setBusy(true)
    try {
      if (disconnect) {
        await notionLocalClient.disconnect()
      } else {
        setSources(null)
        setCursor(null)
        setDataSourceId("")
        const result = await notionLocalClient.beginSelection(token.trim() || undefined)
        setSources(result.items)
        setCursor(result.nextCursor)
        setQuery("")
        setAppliedQuery("")
      }
      setProperties(null)
      setMapping({})
      setToken("")
      setDataSourceId("")
      await queryClient.invalidateQueries({ queryKey: notionStatusQueryKey })
      if (disconnect) {
        setSources(null)
        toast.success(t("integration.notion.disconnected"))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : ""
      toast.error(
        t(
          message.includes("NOTION_LOCAL_STORAGE")
            ? "integration.notion.storage_unavailable"
            : "integration.notion.search_failed",
        ),
      )
    } finally {
      setToken("")
      pendingRef.current = false
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 py-4">
      <p className="text-sm text-text-secondary">{t("integration.notion.description")}</p>
      {status.data?.legacy && (
        <p role="status" className="text-sm text-text-secondary">
          {t("integration.notion.legacy_connection")}
        </p>
      )}
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
        {showConnection && (
          <>
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
            {sources && (
              <div className="space-y-3">
                <label className="flex flex-col gap-2 text-sm">
                  {t("integration.notion.search_label")}
                  <InputV2
                    placeholder={t("integration.notion.search_placeholder")}
                    aria-label={t("integration.notion.search")}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={busy}
                  />
                </label>
                <Button type="button" disabled={busy} onClick={() => void picker("search")}>
                  {t("integration.notion.search")}
                </Button>
                <select
                  aria-label={t("integration.notion.select_database")}
                  className="w-full rounded-md border border-fill bg-material-thick p-2 text-text"
                  value={dataSourceId}
                  disabled={busy}
                  onChange={(e) => setDataSourceId(e.target.value)}
                >
                  <option value="">{t("integration.notion.select_database")}</option>
                  {sources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.title} · {source.id.slice(0, 8)} ({source.databaseId.slice(0, 8)})
                    </option>
                  ))}
                </select>
                {!sources.length && <p>{t("integration.notion.empty")}</p>}
                {cursor && (
                  <Button type="button" disabled={busy} onClick={() => void picker("more")}>
                    {t("integration.notion.more")}
                  </Button>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    disabled={busy || !dataSourceId}
                    onClick={() => void picker("select")}
                  >
                    {t("integration.notion.use_database")}
                  </Button>
                  <Button type="button" disabled={busy} onClick={() => void picker("cancel")}>
                    {t("integration.notion.cancel")}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        {!showConnection && (
          <Button type="button" variant="outline" onClick={() => setEditing(true)}>
            {t("integration.notion.edit_connection")}
          </Button>
        )}
        <div className="space-y-3 rounded-lg border border-fill p-3">
          <Button
            type="button"
            variant="outline"
            disabled={busy || !status.data?.configured}
            onClick={() => void mappingAction(false, !!properties)}
          >
            {t(properties ? "integration.notion.mapping_refresh" : "integration.notion.mapping")}
          </Button>
          <p className="text-xs text-text-secondary">
            {t(
              status.data?.configured
                ? "integration.notion.mapping_help"
                : "integration.notion.mapping_connect",
            )}
          </p>
          <p className="text-xs text-text-secondary">{t("integration.notion.ai_existing_only")}</p>
          {properties && (
            <div className="space-y-3">
              <p className="text-sm">
                {t("integration.notion.mapping_title")}:{" "}
                {properties.find((p) => p.type === "title")?.name}
              </p>
              {(
                [
                  "url",
                  "feedTitle",
                  "author",
                  "publishedAt",
                  "description",
                  "aiSummary",
                  "categories",
                ] as const
              ).map((field) => (
                <label key={field} className="flex flex-col gap-2 text-sm">
                  {t(
                    field === "url"
                      ? "integration.notion.mapping_url"
                      : field === "feedTitle"
                        ? "integration.notion.mapping_source"
                        : `integration.notion.mapping_${field}`,
                  )}
                  <select
                    className="rounded-md border border-fill bg-material-thick p-2 text-text"
                    disabled={busy}
                    value={mapping[field] || ""}
                    onChange={(event) =>
                      setMapping((current) => {
                        const next = { ...current }
                        if (event.target.value) next[field] = event.target.value
                        else delete next[field]
                        return next
                      })
                    }
                  >
                    <option value="">
                      {t(
                        properties.some(
                          (p) =>
                            p.type ===
                            (field === "url"
                              ? "url"
                              : field === "publishedAt"
                                ? "date"
                                : "rich_text"),
                        )
                          ? "integration.notion.mapping_none"
                          : "integration.notion.mapping_no_fields",
                      )}
                    </option>
                    {mapping[field] &&
                      !properties.some(
                        (p) =>
                          p.id === mapping[field] &&
                          p.type ===
                            (field === "url"
                              ? "url"
                              : field === "publishedAt"
                                ? "date"
                                : "rich_text"),
                      ) && (
                        <option value={mapping[field]}>
                          {t("integration.notion.mapping_invalid")}
                        </option>
                      )}
                    {properties
                      .filter(
                        (p) =>
                          p.type ===
                          (field === "url"
                            ? "url"
                            : field === "publishedAt"
                              ? "date"
                              : "rich_text"),
                      )
                      .map((p) => (
                        <option
                          key={p.id}
                          value={p.id}
                          disabled={Object.entries(mapping).some(
                            ([key, value]) => key !== field && value === p.id,
                          )}
                        >
                          {p.name}
                        </option>
                      ))}
                  </select>
                </label>
              ))}
              {!properties.some((p) => p.type === "date") && (
                <p className="text-xs text-text-secondary">
                  {t("integration.notion.mapping_no_date")}
                </p>
              )}
              <Button type="button" disabled={busy} onClick={() => void mappingAction(true)}>
                {t("integration.notion.mapping_save")}
              </Button>
            </div>
          )}
        </div>
        {showConnection && (
          <p className="text-xs text-text-tertiary">{t("integration.notion.permissions")}</p>
        )}
        <div className="flex gap-2">
          {showConnection && (
            <Button type="submit" disabled={busy || (!token.trim() && !status.data?.configured)}>
              {t("integration.notion.connect")}
            </Button>
          )}
          {(status.data?.configured || status.isError) && (
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
