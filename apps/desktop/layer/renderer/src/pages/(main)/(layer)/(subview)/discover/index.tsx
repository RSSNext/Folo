import { cn } from "@follow/utils/utils"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"

import { AppErrorBoundary } from "~/components/common/AppErrorBoundary"
import { ErrorComponentType } from "~/components/errors/enum"
import { useSubViewTitle } from "~/modules/app-layout/subview/hooks"
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
  return <section className={cn("mx-auto w-full max-w-6xl", className)}>{children}</section>
}

// ============================================================================
// Main Component
// ============================================================================

export function Component() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const keyword = searchParams.get("keyword")
  const isSearching = !!keyword?.trim()
  useSubViewTitle("words.discover")

  return (
    <div className="flex size-full flex-col px-6 py-8">
      {/* Hero Section */}
      <Section className="mb-12">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-text">{t("words.discover")}</h1>
          <p className="text-sm text-text-secondary">{t("discover.tips.search_keyword")}</p>
        </div>
      </Section>

      {/* Search Section */}
      <Section className="mb-12">
        <div className="flex flex-col items-center">
          <UnifiedDiscoverForm />
        </div>
      </Section>

      {/* Discovery Section - Hide when searching */}
      {!isSearching && (
        <Section>
          <AppErrorBoundary errorType={ErrorComponentType.RSSHubDiscoverError}>
            <DiscoveryContent />
          </AppErrorBoundary>
        </Section>
      )}
    </div>
  )
}
