import { RELATIVE_DATE_DEFINITIONS } from "../hooks/dateMentionConfig"
import type { LabelTranslator } from "../hooks/dateMentionUtils"
import { formatLocalizedRange, parseRangeValue } from "../hooks/dateMentionUtils"
import { parseDateRangeById } from "./parseNaturalLanguageDate"

const MENTION_DATE_TAG = /<mention-date\b([^>]*)><\/mention-date>/g
const TEXT_ATTRIBUTE = /\btext="([^"]*)"/

/**
 * Shows the date mentions of a prompt, such as `<mention-date text="24hoursago"></mention-date>`,
 * as the dates they stand for. The server turns these tags into dates before the model reads the
 * prompt, so a preview of the prompt shows the dates instead of the markup.
 */
export const formatPromptDateMentions = (
  prompt: string,
  translate: LabelTranslator,
  locale: string,
) =>
  prompt.replaceAll(MENTION_DATE_TAG, (tag, attributes: string) => {
    const text = attributes.match(TEXT_ATTRIBUTE)?.[1]
    const relativeDate = RELATIVE_DATE_DEFINITIONS.find((definition) => definition.id === text)
    if (relativeDate) {
      return translate(relativeDate.labelKey)
    }

    const range = parseRangeValue(attributes) ?? parseDateRangeById(text, locale)
    return range ? formatLocalizedRange(range, locale, "LL") : tag
  })
