import { usePrefetchEntryDetail } from "@follow/store/entry/hooks"

import { Paper } from "~/components/ui/paper"
import { EntryContent } from "~/modules/entry-content/components/entry-content"

export const EntryModalPreview = ({ entryId }: { entryId: string }) => {
  const { isPending } = usePrefetchEntryDetail(entryId)

  return (
    <Paper className="p-0 !pt-16 empty:hidden">
      {isPending ? (
        <PeekModalSkeleton />
      ) : (
        <EntryContent
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
        <div className="bg-fill h-8 w-3/4 rounded-lg" />
        <div className="flex items-center space-x-4">
          <div className="bg-fill-secondary h-4 w-20 rounded" />
          <div className="bg-fill-secondary h-4 w-16 rounded" />
          <div className="bg-fill-secondary h-4 w-24 rounded" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <div className="bg-fill-secondary h-4 w-full rounded" />
          <div className="bg-fill-secondary h-4 w-5/6 rounded" />
          <div className="bg-fill-secondary h-4 w-4/5 rounded" />
        </div>

        <div className="space-y-3">
          <div className="bg-fill-secondary h-4 w-full rounded" />
          <div className="bg-fill-secondary h-4 w-3/4 rounded" />
        </div>

        <div className="bg-fill my-6 h-48 w-full rounded-lg" />

        <div className="space-y-3">
          <div className="bg-fill-secondary h-4 w-full rounded" />
          <div className="bg-fill-secondary h-4 w-5/6 rounded" />
          <div className="bg-fill-secondary h-4 w-2/3 rounded" />
        </div>
      </div>

      <div className="mt-8 flex items-center space-x-3">
        <div className="bg-fill h-8 w-16 rounded" />
        <div className="bg-fill h-8 w-20 rounded" />
        <div className="w-18 bg-fill h-8 rounded" />
      </div>
    </div>
  )
}
