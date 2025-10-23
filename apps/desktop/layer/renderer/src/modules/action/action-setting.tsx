import { Button } from "@follow/components/ui/button/index.js"
import { LoadingWithIcon } from "@follow/components/ui/loading/index.jsx"
import * as ScrollArea from "@follow/components/ui/scroll-area/ScrollArea.js"
import {
  useActionRules,
  useIsActionDataDirty,
  usePrefetchActions,
  useUpdateActionsMutation,
} from "@follow/store/action/hooks"
import { actionActions } from "@follow/store/action/store"
import { JsonObfuscatedCodec } from "@follow/utils/json-codec"
import { cn } from "@follow/utils/utils"
import { useQueryClient } from "@tanstack/react-query"
import { m } from "motion/react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { unstable_usePrompt } from "react-router"
import { toast } from "sonner"

import { HeaderActionButton, HeaderActionGroup } from "~/components/ui/button/HeaderActionButton"
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
import {
  buildActionSummary,
  buildConditionSummary,
  getRuleDisplayName,
} from "~/modules/action/rule-summary"

import { useSetSubViewRightView } from "../app-layout/subview/hooks"
import { generateExportFilename } from "./utils"

const EmptyActionPlaceholder = () => {
  const { t } = useTranslation("settings")

  return (
    <div className="relative flex min-h-96 w-full items-center justify-center">
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Simple icon */}
        <div className="flex size-14 items-center justify-center rounded-lg border border-fill-secondary bg-fill-quinary">
          <i className="i-mgc-magic-2-cute-re size-7 text-text-secondary" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-text">
            {t("actions.action_card.empty.title")}
          </h2>
          <p className="max-w-sm text-sm text-text-secondary">
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
        <div className="flex items-center gap-2 text-text-secondary">
          <span className="text-sm font-medium">{t("actions.action_card.empty.start")}</span>
          <i className="i-mgc-arrow-right-up-cute-re size-5" />
        </div>
      </m.div>
    </div>
  )
}

export const ActionSetting = () => {
  const actions = useActionRules()
  const { t } = useTranslation("settings")

  const [selectedRuleIndex, setSelectedRuleIndex] = useState(0)
  const actionQuery = usePrefetchActions()

  useEffect(() => {
    if (actions.length === 0) {
      setSelectedRuleIndex(0)
      return
    }

    if (selectedRuleIndex > actions.length - 1) {
      setSelectedRuleIndex(actions.length - 1)
    }
  }, [actions.length, selectedRuleIndex])

  if (actionQuery.isPending) {
    return (
      <LoadingWithIcon
        className="flex h-64 items-center justify-center"
        icon={<i className="i-mgc-magic-2-cute-re" />}
        size="large"
      />
    )
  }

  const hasActions = actions.length > 0

  const handleCreateRule = () => {
    const nextIndex = actions.length
    actionActions.addRule((number) => t("actions.actionName", { number }))
    setSelectedRuleIndex(nextIndex)
  }

  return (
    <>
      <ActionButtonGroup onCreateRule={handleCreateRule} />
      <ShareImportSection />
      {hasActions ? (
        <div className="flex min-h-0 w-full flex-1 flex-col @[960px]:absolute @[960px]:inset-x-0 @[960px]:bottom-0 @[960px]:top-12">
          <div className="hidden h-full flex-1 @[960px]:flex @[960px]:h-0 @[960px]:overflow-hidden @[960px]:rounded-lg @[960px]:border @[960px]:border-fill-secondary">
            <RuleList selectedIndex={selectedRuleIndex} onSelect={setSelectedRuleIndex} />
            <div className="flex flex-1 border-l border-fill-secondary">
              <RuleCard index={selectedRuleIndex} mode="detail" />
            </div>
          </div>
          <div className="flex flex-col gap-3 @[960px]:hidden">
            {actions.map((_, actionIdx) => (
              <RuleCard
                key={actionIdx}
                index={actionIdx}
                mode="compact"
                defaultOpen={actionIdx === selectedRuleIndex}
                onOpenChange={(open) => {
                  if (open) {
                    setSelectedRuleIndex(actionIdx)
                  }
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <EmptyActionPlaceholder />
      )}
    </>
  )
}

const ShareImportSection = () => {
  const { t } = useTranslation("settings")
  const actionLength = useActionRules((actions) => actions.length)
  const hasActions = actionLength > 0

  const handleExport = useCallback(() => {
    try {
      const jsonData = actionActions.exportRules()
      const filename = generateExportFilename()
      downloadJsonFile(jsonData, filename)
      toast.success(`Action rules exported successfully as ${filename}`)
    } catch {
      toast.error("Failed to export action rules")
    }
  }, [])

  const handleImport = useCallback(async () => {
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
        return
      }
      toast.error("Failed to import action rules")
    }
  }, [])

  const foloPrefix = "folo:actions#"
  const handleCopyToClipboard = useCallback(async () => {
    try {
      const jsonData = actionActions.exportRules()
      const codecData = JsonObfuscatedCodec.encode(jsonData)
      await copyToClipboard(`${foloPrefix}${codecData}`)
      toast.success("Action rules copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy action rules to clipboard")
      console.error(error)
    }
  }, [foloPrefix])

  const handleImportFromClipboard = useCallback(async () => {
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
  }, [foloPrefix])

  return (
    <div className="mb-4 flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            buttonClassName="size-9 p-0"
            aria-label={
              hasActions
                ? t("actions.action_card.summary.share")
                : t("actions.action_card.summary.import")
            }
          >
            <i
              className={cn(
                "size-4",
                hasActions ? "i-mgc-share-forward-cute-re" : "i-mgc-file-import-cute-re",
              )}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleExport} disabled={!hasActions}>
            <i className="i-mgc-download-2-cute-re mr-3 size-4" />
            {t("actions.action_card.summary.export")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleImport}>
            <i className="i-mgc-file-upload-cute-re mr-3 size-4" />
            {t("actions.action_card.summary.import_file")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCopyToClipboard} disabled={!hasActions}>
            <i className="i-mgc-copy-2-cute-re mr-3 size-4" />
            {t("actions.action_card.summary.copy")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleImportFromClipboard}>
            <i className="i-mgc-paste-cute-re mr-3 size-4" />
            {t("actions.action_card.summary.import_clipboard")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

const RuleList = ({
  selectedIndex,
  onSelect,
}: {
  selectedIndex: number
  onSelect: (index: number) => void
}) => {
  const rules = useActionRules()
  const { t } = useTranslation("settings")

  if (rules.length === 0) {
    return null
  }

  return (
    <div className="flex w-[260px] shrink-0 flex-col">
      <ScrollArea.ScrollArea rootClassName="h-full" viewportClassName="h-full">
        <div className="flex flex-col">
          {rules.map((rule, index) => {
            const isActive = index === selectedIndex
            const displayName = getRuleDisplayName(rule, index, t)
            const whenSummary = buildConditionSummary(rule, t)
            const actionSummary = buildActionSummary(rule, t)

            return (
              <button
                key={rule.index ?? index}
                type="button"
                onClick={() => onSelect(index)}
                className={cn(
                  "flex flex-col gap-1 border-b border-fill-tertiary px-4 py-3 text-left transition-all last:border-b-0",
                  isActive ? "bg-fill-quaternary" : "hover:bg-fill-quinary",
                )}
              >
                <span className="text-sm font-medium text-text">{displayName}</span>
                <span className="line-clamp-2 text-xs text-text-secondary">{whenSummary}</span>
                <span className="line-clamp-1 text-xs text-text-secondary">{actionSummary}</span>
              </button>
            )
          })}
        </div>
      </ScrollArea.ScrollArea>
    </div>
  )
}

const ActionButtonGroup = ({ onCreateRule }: { onCreateRule: () => void }) => {
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
      queryClient.invalidateQueries({
        queryKey: ["entries"],
      })
      toast(t("actions.saveSuccess"))
    },
    onError: (error) => {
      toast.error(error)
    },
  })

  const hasActions = actionLength > 0

  const setRightView = useSetSubViewRightView()
  useEffect(() => {
    setRightView(
      <HeaderActionGroup>
        <HeaderActionButton variant="primary" icon="i-mingcute-add-line" onClick={onCreateRule}>
          {t("actions.newRule")}
        </HeaderActionButton>

        {hasActions && (
          <HeaderActionButton
            variant="accent"
            icon="i-mgc-check-circle-cute-re"
            disabled={!isDirty}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Saving..." : t("actions.save")}
          </HeaderActionButton>
        )}
      </HeaderActionGroup>,
    )
    return () => {
      setRightView(null)
    }
  }, [setRightView, actionLength, hasActions, isDirty, mutation, onCreateRule, t])

  return null
}
