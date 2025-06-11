import {
  SimpleIconsCubox,
  SimpleIconsEagle,
  SimpleIconsInstapaper,
  SimpleIconsObsidian,
  SimpleIconsOutline,
  SimpleIconsReadeck,
  SimpleIconsReadwise,
  SimpleIconsZotero,
} from "@follow/components/ui/platform-icon/icons.js"
import { IN_ELECTRON } from "@follow/shared/constants"
import { getEntry } from "@follow/store/entry/getter"
import type { EntryModel } from "@follow/store/entry/types"
import { tracker } from "@follow/tracker"
import { useMutation, useQuery } from "@tanstack/react-query"
import type { FetchError } from "ofetch"
import { ofetch } from "ofetch"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { getReadabilityStatus, ReadabilityStatus } from "~/atoms/readability"
import { getActionLanguage } from "~/atoms/settings/general"
import { getIntegrationSettings, useIntegrationSettingKey } from "~/atoms/settings/integration"
import { useRouteParams } from "~/hooks/biz/useRouteParams"
import { ipcServices } from "~/lib/client"
import { parseHtml } from "~/lib/parse-html"
import { queryClient } from "~/lib/query-client"
import { Queries } from "~/queries"

import { useRegisterCommandEffect } from "../hooks/use-register-command"
import { defineFollowCommand } from "../registry/command"
import type { Command, CommandCategory } from "../types"
import { COMMAND_ID } from "./id"

export const useRegisterIntegrationCommands = () => {
  useRegisterEagleCommands()
  useRegisterReadwiseCommands()
  useRegisterInstapaperCommands()
  useRegisterObsidianCommands()
  useRegisterOutlineCommands()
  useRegisterReadeckCommands()
  useRegisterCuboxCommands()
  useRegisterZoteroCommands()
}

const category: CommandCategory = "category.integration"
const useRegisterEagleCommands = () => {
  const { t } = useTranslation()
  const { view } = useRouteParams()

  const enableEagle = useIntegrationSettingKey("enableEagle")

  const checkEagle = useQuery({
    queryKey: ["check-eagle"],
    enabled: ELECTRON && enableEagle && view !== undefined,
    queryFn: async () => {
      try {
        await ofetch("http://localhost:41595", {
          mode: "no-cors",
        })
        return true
      } catch (error: unknown) {
        return (error as FetchError).data?.code === 401
      }
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  const isEagleAvailable = enableEagle && (checkEagle.isLoading ? false : !!checkEagle.data)

  useRegisterCommandEffect(
    !isEagleAvailable
      ? []
      : defineFollowCommand({
          id: COMMAND_ID.integration.saveToEagle,
          label: t("entry_actions.save_media_to_eagle"),
          icon: <SimpleIconsEagle />,
          run: async ({ entryId }) => {
            const entry = getEntry(entryId)
            if (!entry) {
              toast.error("Failed to save to Eagle: entry is not available", {
                duration: 3000,
              })
              return
            }
            if (!entry.url || !entry.media?.length) {
              toast.error('Failed to save to Eagle: "url" or "media" is not available', {
                duration: 3000,
              })
              return
            }
            const response = await ipcServices?.integration.saveToEagle({
              url: entry.url,
              mediaUrls: entry.media.map((m) => m.url),
            })
            if (response?.status === "success") {
              toast.success(t("entry_actions.saved_to_eagle"), {
                duration: 3000,
              })
            } else {
              toast.error(t("entry_actions.failed_to_save_to_eagle"), {
                duration: 3000,
              })
            }
          },
        }),
    {
      deps: [isEagleAvailable],
    },
  )
}

const useRegisterReadwiseCommands = () => {
  const { t } = useTranslation()

  const enableReadwise = useIntegrationSettingKey("enableReadwise")
  const readwiseToken = useIntegrationSettingKey("readwiseToken")

  const isReadwiseAvailable = enableReadwise && !!readwiseToken

  useRegisterCommandEffect(
    !isReadwiseAvailable
      ? []
      : defineFollowCommand({
          id: COMMAND_ID.integration.saveToReadwise,
          label: t("entry_actions.save_to_readwise"),
          icon: <SimpleIconsReadwise />,
          category,
          run: async ({ entryId }) => {
            const entry = getEntry(entryId)
            if (!entry) {
              toast.error("Failed to save to Readwise: entry is not available", { duration: 3000 })
              return
            }
            try {
              tracker.integration({
                type: "readwise",
                event: "save",
              })
              const data = await ofetch("https://readwise.io/api/v3/save/", {
                method: "POST",
                headers: {
                  Authorization: `Token ${readwiseToken}`,
                },
                body: {
                  url: entry.url,
                  html: entry.content || undefined,
                  title: entry.title || undefined,
                  author: entry.author || undefined,
                  summary: entry.description || undefined,
                  published_date: entry.publishedAt || undefined,
                  image_url: entry.media?.[0]?.url || undefined,
                  saved_using: "Follow",
                },
              })

              toast.success(
                <>
                  {t("entry_actions.saved_to_readwise")},{" "}
                  <a target="_blank" className="underline" href={data.url}>
                    view
                  </a>
                </>,
                {
                  duration: 3000,
                },
              )
            } catch {
              toast.error(t("entry_actions.failed_to_save_to_readwise"), {
                duration: 3000,
              })
            }
          },
        }),
    {
      deps: [isReadwiseAvailable, readwiseToken],
    },
  )
}

const useRegisterInstapaperCommands = () => {
  const { t } = useTranslation()

  const enableInstapaper = useIntegrationSettingKey("enableInstapaper")
  const instapaperUsername = useIntegrationSettingKey("instapaperUsername")
  const instapaperPassword = useIntegrationSettingKey("instapaperPassword")

  const isInstapaperAvailable = enableInstapaper && !!instapaperPassword && !!instapaperUsername

  useRegisterCommandEffect(
    !isInstapaperAvailable
      ? []
      : defineFollowCommand({
          id: COMMAND_ID.integration.saveToInstapaper,
          label: t("entry_actions.save_to_instapaper"),
          icon: <SimpleIconsInstapaper />,
          category,
          run: async ({ entryId }) => {
            const entry = getEntry(entryId)
            if (!entry) {
              toast.error("Failed to save to Instapaper: entry is not available", {
                duration: 3000,
              })
              return
            }

            try {
              tracker.integration({
                type: "instapaper",
                event: "save",
              })
              const data = await ofetch("https://www.instapaper.com/api/add", {
                query: {
                  url: entry.url,
                  title: entry.title,
                },
                method: "POST",
                headers: {
                  Authorization: `Basic ${btoa(`${instapaperUsername}:${instapaperPassword}`)}`,
                },
                parseResponse: JSON.parse,
              })

              toast.success(
                <>
                  {t("entry_actions.saved_to_instapaper")},{" "}
                  <a
                    target="_blank"
                    className="underline"
                    href={`https://www.instapaper.com/read/${data.bookmark_id}`}
                  >
                    view
                  </a>
                </>,
                {
                  duration: 3000,
                },
              )
            } catch {
              toast.error(t("entry_actions.failed_to_save_to_instapaper"), {
                duration: 3000,
              })
            }
          },
        }),
    {
      deps: [isInstapaperAvailable, instapaperUsername, instapaperPassword],
    },
  )
}

const getEntryContentAsMarkdown = async (entry: EntryModel) => {
  const isReadabilityReady = getReadabilityStatus()[entry.id] === ReadabilityStatus.SUCCESS
  const content = (isReadabilityReady ? entry.readabilityContent || "" : entry.content) || ""
  const [toMarkdown, toMdast, gfmTableToMarkdown] = await Promise.all([
    import("mdast-util-to-markdown").then((m) => m.toMarkdown),
    import("hast-util-to-mdast").then((m) => m.toMdast),
    import("mdast-util-gfm-table").then((m) => m.gfmTableToMarkdown),
  ])
  return toMarkdown(toMdast(parseHtml(content).hastTree), {
    extensions: [gfmTableToMarkdown()],
  })
}

const useRegisterObsidianCommands = () => {
  const { t } = useTranslation()

  const enableObsidian = useIntegrationSettingKey("enableObsidian")
  const obsidianVaultPath = useIntegrationSettingKey("obsidianVaultPath")
  const isObsidianAvailable = enableObsidian && !!obsidianVaultPath

  const saveToObsidian = useMutation({
    mutationKey: ["save-to-obsidian"],
    mutationFn: async (data: {
      url: string
      title: string
      content: string
      author: string
      publishedAt: string
      vaultPath: string
    }) => {
      return await ipcServices?.integration.saveToObsidian(data)
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast.success(t("entry_actions.saved_to_obsidian"), {
          duration: 3000,
        })
      } else {
        toast.error(`${t("entry_actions.failed_to_save_to_obsidian")}: ${data?.error}`, {
          duration: 3000,
        })
      }
    },
  })

  useRegisterCommandEffect(
    !IN_ELECTRON || !isObsidianAvailable
      ? []
      : defineFollowCommand({
          id: COMMAND_ID.integration.saveToObsidian,
          label: t("entry_actions.save_to_obsidian"),
          icon: <SimpleIconsObsidian />,
          category,
          run: async ({ entryId }) => {
            const entry = getEntry(entryId)
            if (!entry) {
              toast.error("Failed to save to Obsidian: entry is not available", { duration: 3000 })
              return
            }
            const markdownContent = await getEntryContentAsMarkdown(entry)
            tracker.integration({
              type: "obsidian",
              event: "save",
            })
            saveToObsidian.mutate({
              url: entry.url || "",
              title: entry.title || "",
              content: markdownContent,
              author: entry.author || "",
              publishedAt: entry.publishedAt.toISOString() || "",
              vaultPath: obsidianVaultPath,
            })
          },
        }),
    {
      deps: [isObsidianAvailable, obsidianVaultPath],
    },
  )
}

const useRegisterOutlineCommands = () => {
  const { t } = useTranslation()

  const enableOutline = useIntegrationSettingKey("enableOutline")
  const outlineEndpoint = useIntegrationSettingKey("outlineEndpoint")
  const outlineToken = useIntegrationSettingKey("outlineToken")
  const outlineCollection = useIntegrationSettingKey("outlineCollection")
  const outlineAvailable =
    enableOutline && !!outlineToken && !!outlineEndpoint && !!outlineCollection

  useRegisterCommandEffect(
    !IN_ELECTRON || !outlineAvailable
      ? []
      : defineFollowCommand({
          id: COMMAND_ID.integration.saveToOutline,
          label: t("entry_actions.save_to_outline"),
          icon: <SimpleIconsOutline />,
          category,
          run: async ({ entryId }) => {
            const entry = getEntry(entryId)
            if (!entry) {
              toast.error("Failed to save to Outline: entry is not available", { duration: 3000 })
              return
            }

            try {
              const request = async (method: string, params: Record<string, unknown>) => {
                return await ofetch(`${outlineEndpoint.replace(/\/$/, "")}/${method}`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${outlineToken}`,
                  },
                  body: params,
                })
              }
              let collectionId = outlineCollection
              if (!/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(collectionId)) {
                const collection = await request("collections.info", {
                  id: collectionId,
                })
                collectionId = collection.data.id
              }
              const markdownContent = await getEntryContentAsMarkdown(entry)
              await request("documents.create", {
                title: entry.title,
                text: markdownContent,
                collectionId,
                publish: true,
              })
              toast.success(t("entry_actions.saved_to_outline"), {
                duration: 3000,
              })
            } catch {
              toast.error(t("entry_actions.failed_to_save_to_outline"), {
                duration: 3000,
              })
            }
          },
        }),
    {
      deps: [outlineAvailable, outlineToken, outlineEndpoint, outlineCollection],
    },
  )
}

const useRegisterReadeckCommands = () => {
  const { t } = useTranslation()

  const enableReadeck = useIntegrationSettingKey("enableReadeck")
  const readeckEndpoint = useIntegrationSettingKey("readeckEndpoint")
  const readeckToken = useIntegrationSettingKey("readeckToken")
  const readeckAvailable = enableReadeck && !!readeckEndpoint && !!readeckToken

  useRegisterCommandEffect(
    !readeckAvailable
      ? []
      : defineFollowCommand({
          id: COMMAND_ID.integration.saveToReadeck,
          label: t("entry_actions.save_to_readeck"),
          icon: <SimpleIconsReadeck />,
          category,
          run: async ({ entryId }) => {
            const entry = getEntry(entryId)
            if (!entry) {
              toast.error("Failed to save to Readeck: entry is not available", { duration: 3000 })
              return
            }
            try {
              tracker.integration({
                type: "readeck",
                event: "save",
              })
              const data = new FormData()
              if (entry.url) {
                data.set("url", entry.url)
              }
              if (entry.title) {
                data.set("title", entry.title)
              }
              const response = await ofetch.raw(
                `${readeckEndpoint.replace(/\/$/, "")}/api/bookmarks`,
                {
                  method: "POST",
                  body: data,
                  headers: {
                    Authorization: `Bearer ${readeckToken}`,
                  },
                },
              )

              toast.success(
                <>
                  {t("entry_actions.saved_to_readeck")},{" "}
                  <a target="_blank" className="underline" href={response.headers.get("Location")!}>
                    view
                  </a>
                </>,
                {
                  duration: 3000,
                },
              )
            } catch {
              toast.error(t("entry_actions.failed_to_save_to_readeck"), {
                duration: 3000,
              })
            }
          },
        }),
    {
      deps: [readeckAvailable, readeckToken, readeckEndpoint],
    },
  )
}

const useRegisterCuboxCommands = () => {
  const { t } = useTranslation()

  const enableCubox = useIntegrationSettingKey("enableCubox")
  const cuboxToken = useIntegrationSettingKey("cuboxToken")
  const enableCuboxAutoMemo = useIntegrationSettingKey("enableCuboxAutoMemo")
  const cuboxAvailable = enableCubox && !!cuboxToken

  useRegisterCommandEffect(
    !cuboxAvailable
      ? []
      : defineFollowCommand({
          id: COMMAND_ID.integration.saveToCubox,
          label: t("entry_actions.save_to_cubox"),
          icon: <SimpleIconsCubox />,
          category,
          run: async ({ entryId }) => {
            const entry = getEntry(entryId)
            if (!entry) {
              toast.error("Failed to save to Cubox: entry is not available", { duration: 3000 })
              return
            }
            try {
              tracker.integration({
                type: "cubox",
                event: "save",
              })

              const selectedText = window.getSelection()?.toString() || ""

              const requestBody =
                selectedText && enableCuboxAutoMemo
                  ? buildMemoRequestBody(entry, selectedText)
                  : buildUrlRequestBody(entry)

              await ofetch(cuboxToken, {
                method: "POST",
                body: requestBody,
                headers: {
                  "Content-Type": "application/json",
                },
              })

              toast.success(t("entry_actions.saved_to_cubox"), {
                duration: 3000,
              })
            } catch (error) {
              toast.error(
                `${t("entry_actions.failed_to_save_to_cubox")}: ${(error as FetchError)?.message || ""}`,
                {
                  duration: 3000,
                },
              )
            }
          },
        }),
    {
      deps: [cuboxAvailable, cuboxToken, enableCuboxAutoMemo],
    },
  )
}

const useRegisterZoteroCommands = () => {
  const { t } = useTranslation()

  const enableZotero = useIntegrationSettingKey("enableZotero")
  const zoteroUserID = useIntegrationSettingKey("zoteroUserID")
  const zoteroToken = useIntegrationSettingKey("zoteroToken")
  const zoterAvailable = enableZotero && !!zoteroUserID && !!zoteroToken

  // GET https://api.zotero.org/items/new?itemType=webpage
  const buildZoteroWebpageRequestBody = (entry: EntryModel) => {
    // Zotero API only support ISO 8601 format and without millsecond
    const accessDate = `${entry.insertedAt.toISOString().slice(0, 19)}Z`
    // should return an array, because this API endpoint also support multi-item upload
    return [
      {
        itemType: "webpage",
        title: entry.title || "",
        creators: [
          {
            creatorType: "author",
            firstName: entry.author || "",
            lastName: "",
          },
        ],
        abstractNote: entry.description || "",
        websiteTitle: entry.title || "",
        websiteType: "",
        date: entry.publishedAt || "",
        shortTitle: "",
        url: entry.url || "",
        accessDate: accessDate || "",
        language: entry.language || "",
        rights: "",
        extra: "",
        tags: [],
        collections: [],
        relations: {},
      },
    ]
  }

  useRegisterCommandEffect(
    !zoterAvailable
      ? []
      : defineFollowCommand({
          id: COMMAND_ID.integration.saveToZotero,
          label: t("entry_actions.save_to_zotero"),
          icon: <SimpleIconsZotero />,
          category,
          run: async ({ entryId }) => {
            const entry = getEntry(entryId)
            if (!entry) {
              toast.error("Failed to save to Zotero: entry is not available", { duration: 3000 })
              return
            }
            try {
              tracker.integration({
                type: "zotero",
                event: "save",
              })

              const requestBody = buildZoteroWebpageRequestBody(entry)

              const response = await ofetch(`https://api.zotero.org/users/${zoteroUserID}/items`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Zotero-API-Key": zoteroToken,
                },
                body: requestBody,
              })

              if (response.failed && Object.keys(response.failed).length > 0) {
                response.failed.forEach((failedObj) => {
                  toast.error(failedObj.message, { duration: 3000 })
                })
              }
              if (response.success && Object.keys(response.success).length > 0) {
                toast.success(t("entry_actions.saved_to_zotero"), {
                  duration: 3000,
                })
              }
            } catch (error) {
              const errorObj = error as FetchError
              switch (errorObj.statusCode) {
                case 400: {
                  toast.error(
                    `${t("entry_actions.failed_to_save_to_zotero")}: Invalid type/field; unparseable JSON`,
                    {
                      duration: 3000,
                    },
                  )

                  break
                }
                case 409: {
                  toast.error(
                    `${t("entry_actions.failed_to_save_to_zotero")}: The target library is locked.`,
                    {
                      duration: 3000,
                    },
                  )

                  break
                }
                case 412: {
                  toast.error(
                    `${t("entry_actions.failed_to_save_to_zotero")}: The version provided in If-Unmodified-Since-Version is out of date, or the provided Zotero-Write-Token has already been submitted.`,
                    {
                      duration: 3000,
                    },
                  )

                  break
                }
                case 413: {
                  toast.error(
                    `${t("entry_actions.failed_to_save_to_zotero")}: Too many items submitted`,
                    {
                      duration: 3000,
                    },
                  )

                  break
                }
                default: {
                  toast.error(
                    `${t("entry_actions.failed_to_save_to_zotero")}: ${errorObj.message} || ""`,
                    {
                      duration: 3000,
                    },
                  )
                }
              }
            }
          },
        }),
  )
}

const getDescription = (entry: EntryModel) => {
  const actionLanguage = getActionLanguage()
  const { saveSummaryAsDescription } = getIntegrationSettings()

  if (!saveSummaryAsDescription) {
    return entry.description || ""
  }
  const summary = queryClient
    .getQueriesData({
      queryKey: Queries.ai.summary({ entryId: entry.id, language: actionLanguage }).key,
    })
    .at(0)
    ?.at(1) as string | undefined
  return summary || entry.description || ""
}

const buildUrlRequestBody = (entry: EntryModel) => {
  return {
    type: "url",
    content: entry.url || "",
    title: entry.title || "",
    description: getDescription(entry),
    tags: [],
    folder: "",
  }
}

const buildMemoRequestBody = (entry: EntryModel, selectedText: string) => {
  return {
    type: "memo",
    content: selectedText,
    title: entry.title || "",
    description: getDescription(entry),
    tags: [],
    folder: "",
    source_url: entry.url,
  }
}

export type SaveToEagleCommand = Command<{
  id: typeof COMMAND_ID.integration.saveToEagle
  fn: (payload: { entryId: string }) => void
}>

export type SaveToReadwiseCommand = Command<{
  id: typeof COMMAND_ID.integration.saveToReadwise
  fn: (payload: { entryId: string }) => void
}>

export type SaveToInstapaperCommand = Command<{
  id: typeof COMMAND_ID.integration.saveToInstapaper
  fn: (payload: { entryId: string }) => void
}>

export type SaveToObsidianCommand = Command<{
  id: typeof COMMAND_ID.integration.saveToObsidian
  fn: (payload: { entryId: string }) => void
}>

export type SaveToOutlineCommand = Command<{
  id: typeof COMMAND_ID.integration.saveToOutline
  fn: (payload: { entryId: string }) => void
}>

export type SaveToReadeckCommand = Command<{
  id: typeof COMMAND_ID.integration.saveToReadeck
  fn: (payload: { entryId: string }) => void
}>

export type SaveToCuboxCommand = Command<{
  id: typeof COMMAND_ID.integration.saveToCubox
  fn: (payload: { entryId: string }) => void
}>

export type SaveToZoteroCommand = Command<{
  id: typeof COMMAND_ID.integration.saveToZotero
  fn: (payload: { entryId: string }) => void
}>

export type IntegrationCommand =
  | SaveToEagleCommand
  | SaveToReadwiseCommand
  | SaveToInstapaperCommand
  | SaveToObsidianCommand
  | SaveToOutlineCommand
  | SaveToReadeckCommand
  | SaveToCuboxCommand
  | SaveToZoteroCommand
