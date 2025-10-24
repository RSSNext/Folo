import { usePrefetchEntryDetail } from "@follow/store/entry/hooks"

import { Paper } from "~/components/ui/paper"
import { EntryContentForPreview } from "~/modules/entry-content/EntryContentForPreview"

export const EntryModalPreview = ({ entryId }: { entryId: string }) => {
  const { isPending } = usePrefetchEntryDetail(entryId)

  return (
    <Paper className="p-0 !pt-16 empty:hidden">
      {isPending ? (
        <PeekModalSkeleton />
      ) : (
        <EntryContentForPreview
          className="h-auto [&_#entry-action-header-bar]:!bg-transparent"
          entryId={entryId}
        />
      )}
    </Paper>
  )
}

const PeekModalSkeleton = () => {
  return (
    <div className="animate-pulse p-5">
      <div className="mb-6 space-y-3">
        <div className="h-8 w-3/4 rounded-lg bg-fill" />
        <div className="flex items-center space-x-4">
          <div className="h-4 w-20 rounded bg-fill-secondary" />
          <div className="h-4 w-16 rounded bg-fill-secondary" />
          <div className="h-4 w-24 rounded bg-fill-secondary" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-fill-secondary" />
          <div className="h-4 w-5/6 rounded bg-fill-secondary" />
          <div className="h-4 w-4/5 rounded bg-fill-secondary" />
        </div>

        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-fill-secondary" />
          <div className="h-4 w-3/4 rounded bg-fill-secondary" />
        </div>

        <div className="my-6 h-48 w-full rounded-lg bg-fill" />

        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-fill-secondary" />
          <div className="h-4 w-5/6 rounded bg-fill-secondary" />
          <div className="h-4 w-2/3 rounded bg-fill-secondary" />
        </div>
      </div>

      <div className="mt-8 flex items-center space-x-3">
        <div className="h-8 w-16 rounded bg-fill" />
        <div className="h-8 w-20 rounded bg-fill" />
        <div className="h-8 w-16 rounded bg-fill" />
      </div>
    </div>
  )
}
