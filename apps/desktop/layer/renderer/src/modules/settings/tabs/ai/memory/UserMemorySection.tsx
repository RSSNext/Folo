import { Button } from "@follow/components/ui/button/index.js"
import type { AIMemoryRecord } from "@follow-app/client-sdk"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useAIMemoryListQuery, useDeleteAIMemoryMutation } from "~/modules/ai-memory/query"

export const UserMemorySection = () => {
  const { t } = useTranslation("ai")

  const memoryQuery = useAIMemoryListQuery({ limit: 2 })

  const deleteMutation = useDeleteAIMemoryMutation()

  const memories = useMemo(
    () => memoryQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [memoryQuery.data],
  )

  const handleLoadMore = () => {
    if (!memoryQuery.hasNextPage || memoryQuery.isFetchingNextPage) return
    void memoryQuery.fetchNextPage()
  }

  return (
    <div className="-mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary">{t("memories.list.description")}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!memoryQuery.hasNextPage || memoryQuery.isFetchingNextPage}
          onClick={handleLoadMore}
        >
          {memoryQuery.isFetchingNextPage
            ? t("memories.actions.loading")
            : t("memories.actions.load_more")}
        </Button>
      </div>

      {memoryQuery.isLoading ? (
        <SkeletonList />
      ) : memories.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {memories.map((memory) => (
            <MemoryItemCard
              key={memory.id}
              memory={memory}
              isDeleting={deleteMutation.isPending}
              onDelete={async () => {
                try {
                  await deleteMutation.mutateAsync({ memoryId: memory.id })
                  toast.success(t("memories.toast.deleted"))
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : t("memories.toast.failed"))
                }
              }}
            />
          ))}
        </>
      )}
    </div>
  )
}

const MemoryItemCard = ({
  memory,
  isDeleting,
  onDelete,
}: {
  memory: AIMemoryRecord
  isDeleting: boolean
  onDelete: () => void | Promise<void>
}) => {
  const { t } = useTranslation("ai")

  return (
    <div className="group -ml-3 rounded-lg border border-border p-3 transition-colors hover:bg-material-medium">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <p className="text-sm text-text">{memory.memory}</p>

          <div className="flex flex-wrap items-center gap-1.5">
            {(memory.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-material-thin px-2 py-0.5 text-[11px] font-medium tracking-wide text-text-tertiary"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            buttonClassName="p-0 size-8 flex items-center justify-center"
            onClick={() => onDelete()}
            isLoading={isDeleting}
          >
            <span className="sr-only">{t("words.delete", { ns: "common" })}</span>

            <i className="i-mgc-delete-2-cute-re text-text-secondary" />
          </Button>
        </div>
      </div>
    </div>
  )
}

const SkeletonList = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }, (_, index) => (
      <div
        key={`skeleton-${index}`}
        className="-ml-3 h-24 animate-pulse rounded-lg border border-border bg-fill-secondary/70"
      />
    ))}
  </div>
)

const EmptyState = () => {
  const { t } = useTranslation("ai")
  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-fill-secondary">
        <i className="i-mgc-brain-cute-re size-6 text-text" />
      </div>
      <h4 className="mb-1 text-sm font-medium text-text">{t("memories.list.empty.title")}</h4>
      <p className="text-xs text-text-secondary">{t("memories.list.empty.description")}</p>
    </div>
  )
}
