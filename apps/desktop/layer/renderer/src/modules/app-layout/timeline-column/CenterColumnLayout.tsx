import { EntryColumn } from "~/modules/entry-column"
import { AppLayoutGridContainerProvider } from "~/providers/app-grid-layout-container-provider"

export function CenterColumnLayout() {
  // Two column layout: just show the entry list, no entry content column
  return (
    <div className="relative flex min-w-0 grow">
      <div className="h-full flex-1">
        <AppLayoutGridContainerProvider>
          <EntryColumn />
        </AppLayoutGridContainerProvider>
      </div>
    </div>
  )
}
