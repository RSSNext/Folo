import { Paper } from "~/components/ui/paper"
import { EntryContent } from "~/modules/entry-content/components/entry-content"

export const EntryModalPreview = ({ entryId }: { entryId: string }) => (
  <Paper className="p-0 !pt-16 empty:hidden">
    <EntryContent
      className="h-auto [&_#entry-action-header-bar]:!bg-transparent"
      entryId={entryId}
    />
  </Paper>
)
