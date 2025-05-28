import { Button } from "@follow/components/ui/button/index.js"
import { Checkbox } from "@follow/components/ui/checkbox/index.jsx"
import { Input } from "@follow/components/ui/input/index.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.jsx"
import type { BizRespose } from "@follow/models"
import { cn } from "@follow/utils/utils"
import { useMutation } from "@tanstack/react-query"
import Fuse from "fuse.js"
import { useCallback, useMemo, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"
import { apiFetch } from "~/lib/api-fetch"
import { toastFetchError } from "~/lib/error-parser"
import { Queries } from "~/queries"

import type { ParsedFeedItem, ParsedOpmlData } from "./types"

type FeedResponseList = {
  id: string
  url: string
  title: string | null
}[]
export const OpmlSelectionModal = ({
  parsedData,

  file,
}: {
  parsedData: ParsedOpmlData

  file: File
}) => {
  const { dismiss } = useCurrentModal()

  const importMutation = useMutation({
    mutationFn: async (selectedItems: ParsedFeedItem[]) => {
      const formData = new FormData()

      formData.append("file", file)
      formData.append("items", JSON.stringify(selectedItems.map((i) => i.url)))

      const { data } = await apiFetch<
        BizRespose<{
          successfulItems: FeedResponseList
          conflictItems: FeedResponseList
          parsedErrorItems: FeedResponseList
        }>
      >("/subscriptions/import", {
        method: "POST",
        body: formData,
      })

      return data
    },
    onSuccess: (data) => {
      Queries.subscription.all().invalidateRoot()

      const { successfulItems, conflictItems, parsedErrorItems } = data

      if (parsedErrorItems.length > 0) {
        toast.warning(t("discover.import.import_completed_with_issues"), {
          description: (
            <Trans
              ns="app"
              i18nKey="discover.import.result"
              components={{
                SuccessfulNum: <NumberDisplay value={successfulItems.length} />,
                ConflictNum: <NumberDisplay value={conflictItems.length} />,
                ErrorNum: <NumberDisplay value={parsedErrorItems.length} />,
                br: <br />,
              }}
            />
          ),
          duration: 5000,
        })
      } else {
        dismiss()
        // Show success if everything went well
        toast.success(t("discover.import.import_successful"), {
          description: (
            <Trans
              ns="app"
              i18nKey="discover.import.result"
              components={{
                SuccessfulNum: <NumberDisplay value={successfulItems.length} />,
                ConflictNum: <NumberDisplay value={conflictItems.length} />,
                ErrorNum: <NumberDisplay value={parsedErrorItems.length} />,
                br: <br />,
              }}
            />
          ),
          duration: 5000,
        })
      }
    },
    async onError(err) {
      toastFetchError(err)
    },
  })

  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<Set<string>>(
    () => new Set(parsedData.subscriptions.map((_, index) => index.toString())),
  )

  const fuse = useMemo(() => {
    return new Fuse(parsedData.subscriptions, {
      keys: [
        { name: "title", weight: 0.7 },
        { name: "url", weight: 0.2 },
        { name: "category", weight: 0.1 },
      ],
      threshold: 0.3,
      includeMatches: true,
      minMatchCharLength: 2,
    })
  }, [parsedData.subscriptions])

  const filteredSubscriptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return parsedData.subscriptions.map((item, index) => ({ item, refIndex: index }))
    }

    return fuse.search(searchQuery).map((result) => ({
      item: result.item,
      refIndex: result.refIndex,
    }))
  }, [fuse, searchQuery, parsedData.subscriptions])

  const selectedCount = selectedItems.size
  const isQuotaExceeded = selectedCount > parsedData.remaining
  const quotaWarningThreshold = Math.max(1, Math.floor(parsedData.remaining * 0.8)) // 80% of quota

  const toggleItem = useCallback((index: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }, [])

  const toggleAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        // Select all filtered items, but respect quota
        const filteredIndices = filteredSubscriptions.map(({ refIndex }) => refIndex.toString())
        setSelectedItems((prev) => {
          const newSet = new Set(prev)

          // If we would exceed quota, only select up to the remaining limit
          let addedCount = 0
          for (const index of filteredIndices) {
            if (newSet.size + addedCount >= parsedData.remaining) {
              break
            }
            if (!newSet.has(index)) {
              addedCount++
            }
            newSet.add(index)
          }
          return newSet
        })
      } else {
        // Deselect all filtered items - no quota restrictions for deselection
        const filteredIndices = new Set(
          filteredSubscriptions.map(({ refIndex }) => refIndex.toString()),
        )
        setSelectedItems((prev) => {
          const newSet = new Set(prev)
          filteredIndices.forEach((index) => newSet.delete(index))
          return newSet
        })
      }
    },
    [filteredSubscriptions, parsedData.remaining],
  )

  const handleImport = useCallback(() => {
    const selected = parsedData.subscriptions.filter((_, index) =>
      selectedItems.has(index.toString()),
    )
    importMutation.mutate(selected)
  }, [parsedData.subscriptions, selectedItems, importMutation])

  // Calculate selection states for filtered items
  const filteredSelectedCount = filteredSubscriptions.filter(({ refIndex }) =>
    selectedItems.has(refIndex.toString()),
  ).length

  const allFilteredSelected =
    filteredSelectedCount === filteredSubscriptions.length && filteredSubscriptions.length > 0
  const someFilteredSelected =
    filteredSelectedCount > 0 && filteredSelectedCount < filteredSubscriptions.length

  return (
    <div className="mx-auto flex h-full w-[600px] max-w-full flex-col">
      <div className="mb-4">
        <h3 className="mb-2 text-lg font-semibold">
          {t("discover.import.select_feeds_to_import")}
        </h3>
        <p className="text-text-secondary text-sm">
          {t("discover.import.select_feeds_description")}
        </p>
      </div>

      {/* Quota Status */}
      <div
        className={cn(
          "border-border bg-background mb-4 flex items-center justify-between rounded-lg border px-3 py-2",
          isQuotaExceeded
            ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
            : selectedCount >= quotaWarningThreshold
              ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"
              : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
        )}
      >
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex size-4 items-center justify-center rounded-full",
                  isQuotaExceeded
                    ? "text-red"
                    : selectedCount >= quotaWarningThreshold
                      ? "text-yellow"
                      : "text-green",
                )}
              >
                <i
                  className={cn(
                    isQuotaExceeded
                      ? "i-mgc-close-cute-re"
                      : selectedCount >= quotaWarningThreshold
                        ? "i-mgc-warning-cute-re"
                        : "i-mgc-check-circle-cute-re",
                  )}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isQuotaExceeded ? (
                <p>{t("discover.import.quota_exceeded_warning")}</p>
              ) : selectedCount >= quotaWarningThreshold ? (
                <p>
                  {t("discover.import.quota_warning", {
                    remaining: parsedData.remaining - selectedCount,
                  })}
                </p>
              ) : (
                <p>
                  {t("discover.import.remaining_quota", {
                    remaining: parsedData.remaining - selectedCount,
                  })}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
          <span className="text-sm font-medium">
            {t("discover.import.quota_status")} {selectedCount}/{parsedData.remaining}
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <Input
          placeholder={t("discover.import.search_feeds_placeholder", "Search feeds...")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      <label
        className="mb-4 flex items-center gap-3 rounded-lg px-3 py-2"
        htmlFor="select-all-filtered-feeds"
      >
        <Checkbox
          id="select-all-filtered-feeds"
          checked={allFilteredSelected}
          onCheckedChange={toggleAll}
          indeterminate={someFilteredSelected}
        />
        <span className="font-medium">
          {searchQuery.trim() ? (
            <>
              {t("discover.import.select_all_filtered", "Select all filtered")} (
              {filteredSelectedCount}/{filteredSubscriptions.length})
              {filteredSubscriptions.length < parsedData.subscriptions.length && (
                <span className="text-text-secondary ml-1">
                  of {parsedData.subscriptions.length} total
                </span>
              )}
            </>
          ) : (
            <>
              {t("discover.import.select_all_feeds")} ({selectedItems.size}/
              {parsedData.subscriptions.length})
            </>
          )}
        </span>
      </label>

      <ScrollArea.ScrollArea rootClassName="-mx-2 flex-1 px-2">
        <div className="space-y-2">
          {filteredSubscriptions.length === 0 && searchQuery.trim() ? (
            <div className="text-text-secondary py-8 text-center">
              {t("discover.import.no_feeds_found", "No feeds found matching your search.")}
            </div>
          ) : (
            filteredSubscriptions.map(({ item, refIndex }) => {
              const isSelected = selectedItems.has(refIndex.toString())
              const wouldExceedQuota = !isSelected && selectedCount >= parsedData.remaining

              return (
                <div
                  key={`${item.url}-${refIndex}`}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                    isSelected ? "border-material-thick bg-material-thick" : "border-background",
                    wouldExceedQuota && "cursor-not-allowed opacity-50",
                  )}
                  onClick={() => !wouldExceedQuota && toggleItem(refIndex.toString())}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => !wouldExceedQuota && toggleItem(refIndex.toString())}
                    disabled={wouldExceedQuota}
                  />
                  <div className="min-w-0 flex-1 shrink">
                    <div className="truncate font-medium">{item.title || "Untitled Feed"}</div>
                    <div className="text-text-secondary truncate text-sm">{item.url}</div>
                    {item.category && (
                      <div className="text-text-secondary mt-1 text-xs opacity-80">
                        {item.category}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea.ScrollArea>

      <div className="mt-4 flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={dismiss} disabled={importMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          disabled={selectedItems.size === 0 || isQuotaExceeded || importMutation.isPending}
          isLoading={importMutation.isPending}
        >
          {t("words.import")} ({selectedItems.size})
          {isQuotaExceeded && (
            <span className="ml-1 text-xs">- {t("discover.import.quota_exceeded")}</span>
          )}
        </Button>
      </div>
    </div>
  )
}

const NumberDisplay = ({ value }) => <span className="text-text font-bold">{value ?? 0}</span>
