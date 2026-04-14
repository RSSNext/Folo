import type { SpotlightRule } from "@follow/shared/spotlight"
import { Fragment, useMemo } from "react"
import { Text as RNText } from "react-native"

import { getHighlightedTextSegments } from "./highlightedTextSegments"
import { getHighlightedTextSegmentStyle } from "./highlightedTextStyle"

export const HighlightedText = ({
  text,
  rules,
}: {
  text?: string | null
  rules: SpotlightRule[]
}) => {
  const segments = useMemo(() => getHighlightedTextSegments(text, rules), [rules, text])
  const keyedSegments = useMemo(() => {
    let offset = 0

    return segments.map((segment) => {
      const key = segment.highlight ? `${offset}-${segment.highlight.ruleId}-${segment.text}` : null
      offset += segment.text.length
      return { key: key ?? `${offset}-${segment.text}`, segment }
    })
  }, [segments])

  return (
    <>
      {keyedSegments.map(({ key, segment }) =>
        segment.highlight ? (
          <RNText key={key} style={getHighlightedTextSegmentStyle(segment.highlight.color)}>
            {segment.text}
          </RNText>
        ) : (
          <Fragment key={key}>{segment.text}</Fragment>
        ),
      )}
    </>
  )
}
