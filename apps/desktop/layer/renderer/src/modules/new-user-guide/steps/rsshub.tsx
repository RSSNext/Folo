import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"

import { AppErrorBoundary } from "~/components/common/AppErrorBoundary"
import { ErrorComponentType } from "~/components/errors/enum"
import { useAuthQuery } from "~/hooks/common"
import { Recommendations } from "~/modules/discover/recommendations"
import { Queries } from "~/queries"

export function RSSHubGuide({ categories, lang }: { categories?: string; lang?: string }) {
  const rsshubPopular = useAuthQuery(
    Queries.discover.rsshubCategory({
      category: "popular",
      categories,
      lang,
    }),
    {
      meta: {
        persist: true,
      },
    },
  )

  const { data } = rsshubPopular

  if (rsshubPopular.isLoading) {
    return null
  }

  if (!data) {
    return null
  }

  return (
    <AppErrorBoundary errorType={ErrorComponentType.RSSHubDiscoverError}>
      <ScrollArea.ScrollArea
        viewportClassName="h-[450px]"
        scrollbarClassName="-mr-4"
        flex
        rootClassName="overflow-visible"
      >
        <div className="space-y-3">
          <Recommendations />
        </div>
      </ScrollArea.ScrollArea>
    </AppErrorBoundary>
  )
}
