import { cn } from "@follow/utils/utils"
import { useMemo } from "react"

import { useGeneralSettingKey } from "~/atoms/settings/general"
import { useSpotlightSettingKey } from "~/atoms/settings/spotlight"
import { HTML } from "~/components/ui/markdown/HTML"
import { HighlightedText } from "~/modules/spotlight/HighlightedText"

export const EntryTranslation: Component<{
  source?: string | null
  target?: string | null
  isHTML?: boolean
  inline?: boolean
  bilingual?: boolean
}> = ({ source, target, className, isHTML, inline = true, bilingual }) => {
  const bilingualFinal = useGeneralSettingKey("translationMode") === "bilingual" || bilingual
  const spotlightRules = useSpotlightSettingKey("spotlights")

  const nextTarget = useMemo(() => {
    if (!target || source === target) {
      return ""
    }
    return target
  }, [source, target])

  if (!source) {
    return null
  }

  if (!bilingualFinal) {
    return (
      <div>
        {isHTML ? (
          <HTML
            as="div"
            className={cn("prose dark:prose-invert", className)}
            noMedia
            spotlightRules={spotlightRules}
          >
            {nextTarget || source}
          </HTML>
        ) : (
          <div className={className}>
            <HighlightedText rules={spotlightRules} text={nextTarget || source} />
          </div>
        )}
      </div>
    )
  }

  const SourceTag = inline ? "span" : "p"

  return (
    <>
      {isHTML ? (
        <HTML
          as="div"
          className={cn("prose dark:prose-invert", className)}
          noMedia
          spotlightRules={spotlightRules}
        >
          {nextTarget || source}
        </HTML>
      ) : (
        <div className={cn(inline && "inline align-middle", className)}>
          {nextTarget && inline && (
            <>
              <span className="align-middle">
                <HighlightedText rules={spotlightRules} text={nextTarget} />
              </span>
              <i className="i-mgc-translate-2-ai-cute-re mx-2 align-middle" />
            </>
          )}
          <SourceTag className={cn(inline && "align-middle")}>
            <HighlightedText rules={spotlightRules} text={source} />
          </SourceTag>
          {nextTarget && !inline && (
            <p>
              <HighlightedText rules={spotlightRules} text={nextTarget} />
            </p>
          )}
        </div>
      )}
    </>
  )
}
