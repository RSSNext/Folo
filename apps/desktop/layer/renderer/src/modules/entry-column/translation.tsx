import { cn } from "@follow/utils/utils"
import { useMemo } from "react"

import { useGeneralSettingKey } from "~/atoms/settings/general"
import { HTML } from "~/components/ui/markdown/HTML"

export const EntryTranslation: Component<{
  source?: string | null
  target?: string | null
  isHTML?: boolean
  inline?: boolean
  bilingual?: boolean
}> = ({ source, target, className, isHTML, inline = true, bilingual }) => {
  const bilingualFinal = useGeneralSettingKey("translationMode") === "bilingual" || bilingual

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
          <HTML as="div" className={cn("prose dark:prose-invert", className)} noMedia>
            {nextTarget || source}
          </HTML>
        ) : (
          <div className={className}>{nextTarget || source}</div>
        )}
      </div>
    )
  }

  const SourceTag = inline ? "span" : "p"

  return (
    <div>
      {isHTML ? (
        <HTML as="div" className={cn("prose dark:prose-invert", className)} noMedia>
          {nextTarget || source}
        </HTML>
      ) : (
        <div className={cn(inline && "inline align-middle", className)}>
          {nextTarget && inline && (
            <>
              <span className="align-middle">{nextTarget}</span>
              <i className="i-mgc-translate-2-ai-cute-re mr-2 align-middle" />
            </>
          )}
          <SourceTag className={cn(inline && "align-middle")}>{source}</SourceTag>
          {nextTarget && !inline && <p>{nextTarget}</p>}
        </div>
      )}
    </div>
  )
}
