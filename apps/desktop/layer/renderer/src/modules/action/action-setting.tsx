import { Button } from "@follow/components/ui/button/index.js"
import { LoadingWithIcon } from "@follow/components/ui/loading/index.jsx"
import {
  useActionRules,
  useIsActionDataDirty,
  usePrefetchActions,
  useUpdateActionsMutation,
} from "@follow/store/action/hooks"
import { actionActions } from "@follow/store/action/store"
import { JsonObfuscatedCodec } from "@follow/utils/json-codec"
import { useQueryClient } from "@tanstack/react-query"
import { m } from "motion/react"
import { useTranslation } from "react-i18next"
import { unstable_usePrompt } from "react-router"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu.js"
import { copyToClipboard, readFromClipboard } from "~/lib/clipboard"
import { downloadJsonFile, selectJsonFile } from "~/lib/export"
import { RuleCard } from "~/modules/action/rule-card"

import { generateExportFilename } from "./utils"

const EmptyActionPlaceholder = () => {
  const { t } = useTranslation("settings")

  return (
    <div className="relative flex min-h-96 w-full items-center justify-center">
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Simple icon */}
        <div className="bg-fill-quaternary flex size-16 items-center justify-center rounded-2xl">
          <i className="i-mgc-magic-2-cute-re text-text-secondary size-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-text text-xl font-semibold">
            {t("actions.action_card.empty.title")}
          </h2>
          <p className="text-text-secondary max-w-sm text-sm">
            {t("actions.action_card.empty.description")}
          </p>
        </div>
      </div>
      <m.div
        className="absolute -top-6 right-20"
        animate={{
          x: [0, 8, 0],
          y: [0, -4, 0],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="text-text-tertiary flex items-center gap-2">
          <span className="text-sm font-medium">{t("actions.action_card.empty.start")}</span>
          <i className="i-mgc-arrow-right-up-cute-re size-6" />
        </div>
      </m.div>
    </div>
  )
}

export const ActionSetting = () => {
  const actions = useActionRules()

  const actionQuery = usePrefetchActions()

  if (actionQuery.isPending) {
    return <LoadingWithIcon icon={<i className="i-mgc-magic-2-cute-re" />} size="large" />
  }

  const hasActions = actions.length > 0

  return (
    <div className="flex w-full flex-col gap-6">
      <ActionButtonGroup />
      {hasActions ? (
        <div className="@container flex flex-col gap-6">
          {actions.map((_, actionIdx) => {
            return <RuleCard key={actionIdx} index={actionIdx} />
          })}
        </div>
      ) : (
        <EmptyActionPlaceholder />
      )}
    </div>
  )
}

const ActionButtonGroup = () => {
  const queryClient = useQueryClient()
  const actionLength = useActionRules((actions) => actions.length)
  const isDirty = useIsActionDataDirty()
  const { t } = useTranslation("settings")
  unstable_usePrompt({
    message: t("actions.navigate.prompt"),
    when: ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
  })

  const mutation = useUpdateActionsMutation({
    onSuccess: () => {
      // apply new action settings
      queryClient.invalidateQueries({
        queryKey: ["entries"],
      })
      toast(t("actions.saveSuccess"))
    },
    onError: (error) => {
      toast.error(error)
    },
  })

  const handleExport = () => {
    try {
      const jsonData = actionActions.exportRules()
      const filename = generateExportFilename()
      downloadJsonFile(jsonData, filename)
      toast.success(`Action rules exported successfully as ${filename}`)
    } catch {
      toast.error("Failed to export action rules")
    }
  }

  const handleImport = async () => {
    try {
      const jsonData = await selectJsonFile()
      const result = actionActions.importRules(jsonData)

      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      if (error instanceof Error && error.message === "No file selected") {
        // User cancelled file selection, don't show error
        return
      }
      toast.error("Failed to import action rules")
    }
  }

  const foloPrefix = "folo:actions#"
  const handleCopyToClipboard = async () => {
    try {
      const jsonData = actionActions.exportRules()
      const codecData = JsonObfuscatedCodec.encode(jsonData)

      await copyToClipboard(`${foloPrefix}${codecData}`)
      toast.success("Action rules copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy action rules to clipboard")
      console.error(error)
    }
  }

  const handleImportFromClipboard = async () => {
    try {
      const clipboardData = await readFromClipboard()
      if (!clipboardData.startsWith(foloPrefix)) {
        toast.error("Invalid clipboard data")
        return
      }
      const codecData = clipboardData.slice(foloPrefix.length)

      const jsonData = JsonObfuscatedCodec.decode(codecData)

      const result = actionActions.importRules(jsonData)

      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("clipboard")) {
        toast.error(error.message)
      } else {
        toast.error("Failed to import from clipboard")
      }
      console.error(error)
    }
  }

  const hasActions = actionLength > 0

  return (
    <div className="mb-6 flex w-full items-center justify-end p-4 lg:justify-between">
      {/* Left side - Simple status */}
      <div className="hidden lg:block">
        <h3 className="text-text text-lg font-medium">
          {hasActions ? `${actionLength} Rules` : "No Rules"}
        </h3>
        <p className="text-text-secondary text-sm">
          {hasActions ? "Active automation rules" : "Create your first automation rule"}
        </p>
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {hasActions ? (
                <i className="i-mgc-share-forward-cute-re mr-2 size-4" />
              ) : (
                <i className="i-mgc-file-import-cute-re mr-2 size-4" />
              )}
              {hasActions ? "Share" : "Import"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleExport} disabled={!hasActions}>
              <i className="i-mgc-download-2-cute-re mr-3 size-4" />
              Export to File
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleImport}>
              <i className="i-mgc-file-upload-cute-re mr-3 size-4" />
              Import from File
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCopyToClipboard} disabled={!hasActions}>
              <i className="i-mgc-copy-2-cute-re mr-3 size-4" />
              Copy to Clipboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleImportFromClipboard}>
              <i className="i-mgc-paste-cute-re mr-3 size-4" />
              Import from Clipboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant={actionLength === 0 ? "primary" : "outline"}
          size="sm"
          onClick={() => actionActions.addRule((number) => t("actions.actionName", { number }))}
        >
          <i className="i-mingcute-add-line mr-2 size-4" />
          {t("actions.newRule")}
        </Button>

        {hasActions && (
          <Button onClick={() => mutation.mutate()} size="sm" disabled={!isDirty}>
            <i className="i-mgc-check-circle-cute-re mr-2 size-4" />
            {t("actions.save")}
          </Button>
        )}
      </div>
    </div>
  )
}
