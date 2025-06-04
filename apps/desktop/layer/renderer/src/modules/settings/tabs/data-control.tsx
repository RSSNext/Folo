import { CarbonInfinitySymbol } from "@follow/components/icons/infinify.jsx"
import { Button, MotionButtonBase } from "@follow/components/ui/button/index.js"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@follow/components/ui/form/index.js"
import { Input } from "@follow/components/ui/input/Input.js"
import { Label } from "@follow/components/ui/label/index.jsx"
import { RadioGroup, RadioGroupItem } from "@follow/components/ui/radio-group/motion.js"
import { Slider } from "@follow/components/ui/slider/index.js"
import { ELECTRON_BUILD } from "@follow/shared/constants"
import { env } from "@follow/shared/env.desktop"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { setGeneralSetting, useGeneralSettingValue } from "~/atoms/settings/general"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { exportDB } from "~/database"
import { ipcServices } from "~/lib/client"
import { queryClient } from "~/lib/query-client"
import { clearLocalPersistStoreData } from "~/store/utils/clear"

import { SettingActionItem, SettingDescription } from "../control"
import { createSetting } from "../helper/builder"
import { SettingItemGroup } from "../section"

const { defineSettingItem, SettingBuilder } = createSetting(
  useGeneralSettingValue,
  setGeneralSetting,
)
export const SettingDataControl = () => {
  const { t } = useTranslation("settings")
  const { present } = useModalStack()

  return (
    <div className="mt-4">
      <SettingBuilder
        settings={[
          {
            type: "title",
            value: t("general.data"),
          },
          defineSettingItem("dataPersist", {
            label: t("general.data_persist.label"),
            description: t("general.data_persist.description"),
          }),

          {
            label: t("general.rebuild_database.label"),
            action: () => {
              present({
                title: t("general.rebuild_database.title"),
                clickOutsideToDismiss: true,
                content: () => (
                  <div className="text-sm">
                    <p>{t("general.rebuild_database.warning.line1")}</p>
                    <p>{t("general.rebuild_database.warning.line2")}</p>
                    <div className="mt-4 flex justify-end">
                      <Button
                        buttonClassName="bg-red-500 px-3 text-white"
                        onClick={async () => {
                          await clearLocalPersistStoreData()
                          window.location.reload()
                        }}
                      >
                        {t("ok", { ns: "common" })}
                      </Button>
                    </div>
                  </div>
                ),
              })
            },
            description: t("general.rebuild_database.description"),
            buttonText: t("general.rebuild_database.button"),
          },
          {
            label: t("general.export_database.label"),
            description: t("general.export_database.description"),
            buttonText: t("general.export_database.button"),
            action: () => {
              exportDB()
            },
          },
          {
            label: t("general.export.label"),
            description: t("general.export.description"),
            buttonText: t("general.export.button"),
            action: () => {
              present({
                title: t("general.export.label"),
                clickOutsideToDismiss: true,
                content: () => <ExportFeedsForm />,
              })
            },
          },

          ELECTRON_BUILD && {
            type: "title",
            value: t("general.cache"),
          },
          ELECTRON_BUILD && AppCacheLimit,
          ELECTRON_BUILD ? CleanElectronCache : CleanCacheStorage,
          ELECTRON_BUILD && {
            type: "title",
            value: t("general.data_file.label"),
          },
          ELECTRON_BUILD && {
            label: t("general.log_file.label"),
            description: t("general.log_file.description"),
            buttonText: t("general.log_file.button"),
            action: () => {
              ;(ipcServices as any)?.revealLogFile?.()
            },
          },
        ]}
      />
    </div>
  )
}

const exportFeedFormSchema = z.object({
  rsshubUrl: z.string().url().optional(),
  folderMode: z.enum(["view", "category"]),
})

const ExportFeedsForm = () => {
  const { t } = useTranslation("settings")

  const form = useForm<z.infer<typeof exportFeedFormSchema>>({
    resolver: zodResolver(exportFeedFormSchema),
    defaultValues: {
      folderMode: "view",
    },
  })

  function onSubmit(values: z.infer<typeof exportFeedFormSchema>) {
    const link = document.createElement("a")
    const exportUrl = new URL(`${env.VITE_API_URL}/subscriptions/export`)
    exportUrl.searchParams.append("folderMode", values.folderMode)
    if (values.rsshubUrl) {
      exportUrl.searchParams.append("RSSHubURL", values.rsshubUrl)
    }
    link.href = exportUrl.toString()
    link.download = "follow.opml"
    link.click()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-sm">
        <FormField
          control={form.control}
          name="rsshubUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("general.export.rsshub_url.label")}</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://rsshub.app" {...field} />
              </FormControl>
              <FormDescription>{t("general.export.rsshub_url.description")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="folderMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("general.export.folder_mode.label")}</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)
                  }}
                >
                  <div className="flex gap-4">
                    <RadioGroupItem
                      label={t("general.export.folder_mode.option.view")}
                      value="view"
                    />
                    <RadioGroupItem
                      label={t("general.export.folder_mode.option.category")}
                      value="category"
                    />
                  </div>
                </RadioGroup>
              </FormControl>
              <FormDescription>{t("general.export.folder_mode.description")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit">{t("ok", { ns: "common" })}</Button>
        </div>
      </form>
    </Form>
  )
}

/**
 * @description clean web app service worker cache
 */
const CleanCacheStorage = () => {
  const { t } = useTranslation("settings")

  return (
    <SettingItemGroup>
      <SettingActionItem
        label={
          <span className="flex items-center gap-1">{t("data_control.clean_cache.button")}</span>
        }
        action={async () => {
          const keys = await caches.keys()
          return Promise.all(
            keys.map((key) => {
              if (key.startsWith("workbox-precache-")) return null
              return caches.delete(key)
            }),
          )
        }}
        buttonText={t("data_control.clean_cache.button")}
      />
      <SettingDescription>{t("data_control.clean_cache.description_web")}</SettingDescription>
    </SettingItemGroup>
  )
}

const CleanElectronCache = () => {
  const { t } = useTranslation("settings")

  return (
    <SettingItemGroup>
      <SettingActionItem
        label={
          <span className="flex items-center gap-1">
            {t("data_control.clean_cache.button")}
            <MotionButtonBase
              onClick={() => {
                ;(ipcServices as any)?.openCacheFolder?.()
              }}
              className="center flex"
            >
              <i className="i-mgc-folder-open-cute-re" />
            </MotionButtonBase>
          </span>
        }
        action={async () => {
          await (ipcServices as any)?.clearCache?.()
          queryClient.setQueryData(["app", "cache", "size"], 0)
        }}
        buttonText={t("data_control.clean_cache.button")}
      />
      <SettingDescription>{t("data_control.clean_cache.description")}</SettingDescription>
    </SettingItemGroup>
  )
}
const AppCacheLimit = () => {
  const { t } = useTranslation("settings")
  const { data: cacheSize, isLoading: isLoadingCacheSize } = useQuery({
    queryKey: ["app", "cache", "size"],
    queryFn: async () => {
      const byteSize = (await (ipcServices as any)?.getCacheSize?.()) ?? 0
      return Math.round(byteSize / 1024 / 1024)
    },
    refetchOnMount: "always",
  })
  const {
    data: cacheLimit,
    isLoading: isLoadingCacheLimit,
    refetch: refetchCacheLimit,
  } = useQuery({
    queryKey: ["app", "cache", "limit"],
    queryFn: async () => {
      const size = (await (ipcServices as any)?.getCacheLimit?.()) ?? 0
      return size
    },
  })

  const onChange = (value: number[]) => {
    ;(ipcServices as any)?.limitCacheSize?.(value[0]!)
    refetchCacheLimit()
  }

  if (isLoadingCacheSize || isLoadingCacheLimit) return null

  const InfinitySymbol = <CarbonInfinitySymbol />
  return (
    <SettingItemGroup>
      <div className={"mb-3 flex items-center justify-between gap-4"}>
        <Label className="center flex">
          {t("data_control.app_cache_limit.label")}

          <span className="center ml-2 flex shrink-0 gap-1 text-xs opacity-60">
            <span>({cacheSize}M</span> /{" "}
            <span className="center flex shrink-0">
              {cacheLimit ? `${cacheLimit}M` : InfinitySymbol})
            </span>
          </span>
        </Label>

        <div className="relative flex w-1/5 flex-col gap-1">
          <Slider
            min={0}
            max={500}
            step={100}
            defaultValue={[cacheLimit ?? 0]}
            onValueCommit={onChange}
          />
          <div className="absolute bottom-[-1.5em] text-base opacity-50">{InfinitySymbol}</div>
          <div className="absolute bottom-[-1.5em] right-0 text-xs opacity-50">500M</div>
        </div>
      </div>
      <SettingDescription>{t("data_control.app_cache_limit.description")}</SettingDescription>
    </SettingItemGroup>
  )
}
