import { cn } from "@follow/utils/utils"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { AppErrorBoundary } from "~/components/common/AppErrorBoundary"
import { ErrorComponentType } from "~/components/errors/enum"
import { useSubViewTitle } from "~/modules/app-layout/subview/hooks"
import { useHasDiscoverSearchData } from "~/modules/discover/atoms/discover"
import { DiscoveryContent } from "~/modules/discover/DiscoveryContent"
import { UnifiedDiscoverForm } from "~/modules/discover/UnifiedDiscoverForm"

// ============================================================================
// Section Components
// ============================================================================

interface SectionProps {
  children: ReactNode
  className?: string
}

function Section({ children, className }: SectionProps) {
  return <section className={cn("mx-auto w-full max-w-5xl", className)}>{children}</section>
}

// ============================================================================
// Main Component
// ============================================================================

export function Component() {
  const { t } = useTranslation()

  useSubViewTitle("words.discover")
  const hasSearchData = useHasDiscoverSearchData()

  return (
    <div className="flex size-full flex-col p-6">
      <Section className="mb-8">
        <div className="rounded-[28px] border border-fill-secondary bg-material-ultra-thin px-6 py-8 shadow-sm">
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold text-text">{t("words.discover")}</h1>
            <p className="text-sm text-text-secondary">{t("discover.tips.search_keyword")}</p>
          </div>
          <div className="mt-6 flex flex-col items-center">
            <UnifiedDiscoverForm />
          </div>
        </div>
      </Section>

      {!hasSearchData && (
        <Section className="mt-8">
          <AppErrorBoundary errorType={ErrorComponentType.RSSHubDiscoverError}>
            <DiscoveryContent />
          </AppErrorBoundary>
        </Section>
      )}
    </div>
  )
}
