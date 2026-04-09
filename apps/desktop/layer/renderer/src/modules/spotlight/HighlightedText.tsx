import type { SpotlightRule } from "@follow/shared/spotlight"
import { spotlightHighlightOpacityHex } from "@follow/shared/spotlight"
import { buildHighlightSegments, compileSpotlightRules } from "@follow/utils/spotlight"
import { useMemo } from "react"

const toHighlightStyle = (color: string): React.CSSProperties => ({
  backgroundColor: `${color}${spotlightHighlightOpacityHex}`,
  borderRadius: 4,
  paddingInline: 1,
})

export const HighlightedText = ({
  text,
  rules,
}: {
  text?: string | null
  rules: SpotlightRule[]
}) => {
  const compiledRules = useMemo(() => compileSpotlightRules(rules), [rules])
  const segments = useMemo(
    () => buildHighlightSegments(text ?? "", compiledRules),
    [compiledRules, text],
  )
  const keyedSegments = useMemo(() => {
    let offset = 0

    return segments.map((segment) => {
      const key = segment.highlight ? `${offset}-${segment.highlight.ruleId}-${segment.text}` : null
      offset += segment.text.length
      return { key, segment }
    })
  }, [segments])

  return (
    <>
      {keyedSegments.map(({ key, segment }) =>
        segment.highlight ? (
          <span key={key} style={toHighlightStyle(segment.highlight.color)}>
            {segment.text}
          </span>
        ) : (
          segment.text
        ),
      )}
    </>
  )
}
