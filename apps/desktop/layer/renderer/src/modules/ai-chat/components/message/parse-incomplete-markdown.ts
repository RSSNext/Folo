// @copy https://github.com/vercel/streamdown/blob/main/packages/streamdown/lib/parse-incomplete-markdown.ts
/* eslint-disable unicorn/prefer-string-slice */
const linkImagePattern = /(!?\[)([^\]]*)$/
const boldPattern = /(\*\*)([^*]*)$/
const italicPattern = /(__)([^_]*)$/
const boldItalicPattern = /(\*\*\*)([^*]*)$/
const singleAsteriskPattern = /(\*)([^*]*)$/
const singleUnderscorePattern = /(_)([^_]*)$/
const inlineCodePattern = /(`)([^`]*)$/
const strikethroughPattern = /(~~)([^~]*)$/

// Detect custom inline reference tags
const mentionTagStartPattern = /<\s*mention-(?:entry|feed)\b/gi
const mentionTagCompletePattern = /^<\s*(mention-(?:entry|feed))/i

// Finds the end index of a mention tag (self-closing or paired) starting at `startIndex`.
// Returns the index of the closing `>` when found outside of quotes; otherwise -1.
const findMentionTagEnd = (text: string, startIndex: number): number => {
  // Don't process if inside a complete code block
  if (hasCompleteCodeBlock(text)) return -1

  let inQuote: '"' | "'" | null = null
  let openingTagEnd = -1
  for (let i = startIndex; i < text.length; i++) {
    const char = text[i]
    if (inQuote) {
      if (char === inQuote && text[i - 1] !== "\\") {
        inQuote = null
      }
      continue
    }
    if (char === '"' || char === "'") {
      inQuote = char
      continue
    }
    if (char === "/" && text[i + 1] === ">") {
      return i + 1 // index of '>' in `/>`
    }
    if (char === ">") {
      openingTagEnd = i
      break
    }
  }

  if (openingTagEnd === -1) {
    return -1
  }

  const openingTag = text.substring(startIndex, openingTagEnd + 1)
  const tagNameMatch = openingTag.match(mentionTagCompletePattern)
  if (!tagNameMatch) {
    return -1
  }

  // If the tag is already self-closing (allow whitespace before `/`)
  if (/\/\s*>$/.test(openingTag)) {
    return openingTagEnd
  }

  const tagName = (tagNameMatch[1] ?? "").toLowerCase()
  if (!tagName) {
    return -1
  }
  const afterOpening = text.substring(openingTagEnd + 1)
  const closingTagPattern = new RegExp(`<\\s*/\\s*${tagName}\\s*>`, "i")
  const closingMatch = closingTagPattern.exec(afterOpening)

  if (!closingMatch) {
    return -1
  }

  return openingTagEnd + 1 + closingMatch.index + closingMatch[0].length - 1
}

// Trims trailing, incomplete `<mention-entry ...>` or `<mention-feed ...>` tags to avoid
// injecting broken raw HTML into markdown while streaming.
const handleIncompleteMentionTags = (text: string): string => {
  // Don't process if inside a complete code block
  if (hasCompleteCodeBlock(text)) {
    return text
  }

  let cutIndex: number | null = null
  let match: RegExpExecArray | null
  mentionTagStartPattern.lastIndex = 0
  while ((match = mentionTagStartPattern.exec(text))) {
    const start = match.index
    const end = findMentionTagEnd(text, start)
    if (end === -1) {
      cutIndex = start
      break
    } else {
      // continue scanning after this complete tag
      mentionTagStartPattern.lastIndex = end + 1
    }
  }

  if (cutIndex !== null) {
    const nextNewlineIndex = text.indexOf("\n", cutIndex)
    if (nextNewlineIndex !== -1) {
      // Remove only the incomplete tag segment and preserve following lines
      return text.substring(0, cutIndex) + text.substring(nextNewlineIndex)
    }
    // No newline after the incomplete tag; drop the trailing incomplete segment
    return text.substring(0, cutIndex)
  }
  return text
}

// Handles `<Use: ...>` wrappers that contain mention tags (self-closing or paired) by:
// - Replacing the whole wrapper with only the inner `<mention-...>` when complete
// - Trimming from `<Use:` if the inner mention tag is incomplete while streaming
const handleUseWrapper = (text: string): string => {
  // Don't process if inside a complete code block
  if (hasCompleteCodeBlock(text)) return text

  const usePattern = /<\s*Use:\s*/gi
  let result = text
  let match: RegExpExecArray | null
  usePattern.lastIndex = 0

  // We rebuild iteratively in case of multiple occurrences
  while ((match = usePattern.exec(result))) {
    const useStart = match.index
    const mentionStart = result.indexOf("<mention-", useStart)
    if (mentionStart === -1) {
      // Incomplete `<Use:` without a mention yet → remove only the incomplete segment
      const nextNewlineIndex = result.indexOf("\n", useStart)
      return nextNewlineIndex !== -1
        ? result.substring(0, useStart) + result.substring(nextNewlineIndex)
        : result.substring(0, useStart)
    }

    // Ensure mention is the immediate content of the Use wrapper (allow whitespace)
    const between = result.substring(useStart + match[0].length, mentionStart)
    if (!/^\s*$/.test(between)) {
      // Unexpected content between Use and mention → treat as plain text, continue
      continue
    }

    const mentionEnd = findMentionTagEnd(result, mentionStart)
    if (mentionEnd === -1) {
      // Mention not finished yet → remove only the incomplete wrapper segment
      const nextNewlineIndex = result.indexOf("\n", useStart)
      return nextNewlineIndex !== -1
        ? result.substring(0, useStart) + result.substring(nextNewlineIndex)
        : result.substring(0, useStart)
    }

    // Replace `<Use: <mention-...>` with `<mention-...>`
    const before = result.substring(0, useStart)
    const mentionTag = result.substring(mentionStart, mentionEnd + 1)
    const after = result.substring(mentionEnd + 1)
    result = before + mentionTag + after

    // Reset the regex lastIndex to continue scanning after the replaced tag
    usePattern.lastIndex = before.length + mentionTag.length
  }

  return result
}

// Helper function to check if we have a complete code block
const hasCompleteCodeBlock = (text: string): boolean => {
  const tripleBackticks = (text.match(/```/g) || []).length
  return tripleBackticks > 0 && tripleBackticks % 2 === 0 && text.includes("\n")
}

// Handles incomplete links and images by preserving them with a special marker
const handleIncompleteLinksAndImages = (text: string): string => {
  const linkMatch = text.match(linkImagePattern)

  if (linkMatch) {
    const isImage = linkMatch[1]?.startsWith("!")

    // For images, we still remove them as they can't show skeleton
    if (isImage) {
      const startIndex = text.lastIndexOf(linkMatch[1]!)
      return text.substring(0, startIndex)
    }

    // For links, preserve the text and close the link with a
    // special placeholder URL that indicates it's incomplete
    return `${text}](streamdown:incomplete-link)`
  }

  return text
}

// Completes incomplete bold formatting (**)
const handleIncompleteBold = (text: string): string => {
  // Don't process if inside a complete code block
  if (hasCompleteCodeBlock(text)) {
    return text
  }

  const boldMatch = text.match(boldPattern)

  if (boldMatch) {
    // Don't close if there's no meaningful content after the opening markers
    // boldMatch[2] contains the content after **
    // Check if content is only whitespace or other emphasis markers
    const contentAfterMarker = boldMatch[2]
    if (!contentAfterMarker || /^[\s_~*`]*$/.test(contentAfterMarker)) {
      return text
    }

    // Check if the bold marker is in a list item context
    // Find the position of the matched bold marker
    const markerIndex = text.lastIndexOf(boldMatch[1]!)
    const beforeMarker = text.substring(0, markerIndex)
    const lastNewlineBeforeMarker = beforeMarker.lastIndexOf("\n")
    const lineStart = lastNewlineBeforeMarker === -1 ? 0 : lastNewlineBeforeMarker + 1
    const lineBeforeMarker = text.substring(lineStart, markerIndex)

    // Check if this line is a list item with just the bold marker
    if (/^\s*[-*+]\s+$/.test(lineBeforeMarker)) {
      // This is a list item with just emphasis markers
      // Check if content after marker spans multiple lines
      const hasNewlineInContent = contentAfterMarker.includes("\n")
      if (hasNewlineInContent) {
        // Don't complete if the content spans to another line
        return text
      }
    }

    const asteriskPairs = (text.match(/\*\*/g) || []).length
    if (asteriskPairs % 2 === 1) {
      return `${text}**`
    }
  }

  return text
}

// Completes incomplete italic formatting with double underscores (__)
const handleIncompleteDoubleUnderscoreItalic = (text: string): string => {
  const italicMatch = text.match(italicPattern)

  if (italicMatch) {
    // Don't close if there's no meaningful content after the opening markers
    // italicMatch[2] contains the content after __
    // Check if content is only whitespace or other emphasis markers
    const contentAfterMarker = italicMatch[2]
    if (!contentAfterMarker || /^[\s_~*`]*$/.test(contentAfterMarker)) {
      return text
    }

    // Check if the underscore marker is in a list item context
    // Find the position of the matched underscore marker
    const markerIndex = text.lastIndexOf(italicMatch[1]!)
    const beforeMarker = text.substring(0, markerIndex)
    const lastNewlineBeforeMarker = beforeMarker.lastIndexOf("\n")
    const lineStart = lastNewlineBeforeMarker === -1 ? 0 : lastNewlineBeforeMarker + 1
    const lineBeforeMarker = text.substring(lineStart, markerIndex)

    // Check if this line is a list item with just the underscore marker
    if (/^\s*[-*+]\s+$/.test(lineBeforeMarker)) {
      // This is a list item with just emphasis markers
      // Check if content after marker spans multiple lines
      const hasNewlineInContent = contentAfterMarker.includes("\n")
      if (hasNewlineInContent) {
        // Don't complete if the content spans to another line
        return text
      }
    }

    const underscorePairs = (text.match(/__/g) || []).length
    if (underscorePairs % 2 === 1) {
      return `${text}__`
    }
  }

  return text
}

// Counts single asterisks that are not part of double asterisks, not escaped, and not list markers
const countSingleAsterisks = (text: string): number => {
  return text.split("").reduce((acc, char, index) => {
    if (char === "*") {
      const prevChar = text[index - 1]
      const nextChar = text[index + 1]
      // Skip if escaped with backslash
      if (prevChar === "\\") {
        return acc
      }
      // Check if this is a list marker (asterisk at start of line followed by space)
      // Look backwards to find the start of the current line
      let lineStartIndex = index
      for (let i = index - 1; i >= 0; i--) {
        if (text[i] === "\n") {
          lineStartIndex = i + 1
          break
        }
        if (i === 0) {
          lineStartIndex = 0
          break
        }
      }
      // Check if this asterisk is at the beginning of a line (with optional whitespace)
      const beforeAsterisk = text.substring(lineStartIndex, index)
      if (beforeAsterisk.trim() === "" && (nextChar === " " || nextChar === "\t")) {
        // This is likely a list marker, don't count it
        return acc
      }
      if (prevChar !== "*" && nextChar !== "*") {
        return acc + 1
      }
    }
    return acc
  }, 0)
}

// Completes incomplete italic formatting with single asterisks (*)
const handleIncompleteSingleAsteriskItalic = (text: string): string => {
  // Don't process if inside a complete code block
  if (hasCompleteCodeBlock(text)) {
    return text
  }

  const singleAsteriskMatch = text.match(singleAsteriskPattern)

  if (singleAsteriskMatch) {
    // Find the first single asterisk position (not part of **)
    let firstSingleAsteriskIndex = -1
    for (let i = 0; i < text.length; i++) {
      if (text[i] === "*" && text[i - 1] !== "*" && text[i + 1] !== "*") {
        firstSingleAsteriskIndex = i
        break
      }
    }

    if (firstSingleAsteriskIndex === -1) {
      return text
    }

    // Get content after the first single asterisk
    const contentAfterFirstAsterisk = text.substring(firstSingleAsteriskIndex + 1)

    // Check if there's meaningful content after the asterisk
    // Don't close if content is only whitespace or emphasis markers
    if (!contentAfterFirstAsterisk || /^[\s_~*`]*$/.test(contentAfterFirstAsterisk)) {
      return text
    }

    const singleAsterisks = countSingleAsterisks(text)
    if (singleAsterisks % 2 === 1) {
      return `${text}*`
    }
  }

  return text
}

// Check if a position is within a math block (between $ or $$)
const isWithinMathBlock = (text: string, position: number): boolean => {
  // Count dollar signs before this position
  let inInlineMath = false
  let inBlockMath = false

  for (let i = 0; i < text.length && i < position; i++) {
    // Skip escaped dollar signs
    if (text[i] === "\\" && text[i + 1] === "$") {
      i++ // Skip the next character
      continue
    }

    if (text[i] === "$") {
      // Check for block math ($$)
      if (text[i + 1] === "$") {
        inBlockMath = !inBlockMath
        i++ // Skip the second $
        inInlineMath = false // Block math takes precedence
      } else if (!inBlockMath) {
        // Only toggle inline math if not in block math
        inInlineMath = !inInlineMath
      }
    }
  }

  return inInlineMath || inBlockMath
}

// Counts single underscores that are not part of double underscores, not escaped, and not in math blocks
const countSingleUnderscores = (text: string): number => {
  return text.split("").reduce((acc, char, index) => {
    if (char === "_") {
      const prevChar = text[index - 1]
      const nextChar = text[index + 1]
      // Skip if escaped with backslash
      if (prevChar === "\\") {
        return acc
      }
      // Skip if within math block
      if (isWithinMathBlock(text, index)) {
        return acc
      }
      // Skip if underscore is word-internal (between word characters)
      if (
        prevChar &&
        nextChar &&
        /[\p{L}\p{N}_]/u.test(prevChar) &&
        /[\p{L}\p{N}_]/u.test(nextChar)
      ) {
        return acc
      }
      if (prevChar !== "_" && nextChar !== "_") {
        return acc + 1
      }
    }
    return acc
  }, 0)
}

// Completes incomplete italic formatting with single underscores (_)
const handleIncompleteSingleUnderscoreItalic = (text: string): string => {
  // Don't process if inside a complete code block
  if (hasCompleteCodeBlock(text)) {
    return text
  }

  const singleUnderscoreMatch = text.match(singleUnderscorePattern)

  if (singleUnderscoreMatch) {
    // Find the first single underscore position (not part of __ and not word-internal)
    let firstSingleUnderscoreIndex = -1
    for (let i = 0; i < text.length; i++) {
      if (
        text[i] === "_" &&
        text[i - 1] !== "_" &&
        text[i + 1] !== "_" &&
        text[i - 1] !== "\\" &&
        !isWithinMathBlock(text, i)
      ) {
        // Check if underscore is word-internal (between word characters)
        const prevChar = i > 0 ? text[i - 1] : ""
        const nextChar = i < text.length - 1 ? text[i + 1] : ""
        if (
          prevChar &&
          nextChar &&
          /[\p{L}\p{N}_]/u.test(prevChar) &&
          /[\p{L}\p{N}_]/u.test(nextChar)
        ) {
          continue
        }

        firstSingleUnderscoreIndex = i
        break
      }
    }

    if (firstSingleUnderscoreIndex === -1) {
      return text
    }

    // Get content after the first single underscore
    const contentAfterFirstUnderscore = text.substring(firstSingleUnderscoreIndex + 1)

    // Check if there's meaningful content after the underscore
    // Don't close if content is only whitespace or emphasis markers
    if (!contentAfterFirstUnderscore || /^[\s_~*`]*$/.test(contentAfterFirstUnderscore)) {
      return text
    }

    const singleUnderscores = countSingleUnderscores(text)
    if (singleUnderscores % 2 === 1) {
      // If text ends with newline(s), insert underscore before them
      const trailingNewlineMatch = text.match(/\n+$/)
      if (trailingNewlineMatch) {
        const textBeforeNewlines = text.slice(0, -trailingNewlineMatch[0].length)
        return `${textBeforeNewlines}_${trailingNewlineMatch[0]}`
      }
      return `${text}_`
    }
  }

  return text
}

// Checks if a backtick at position i is part of a triple backtick sequence
const isPartOfTripleBacktick = (text: string, i: number): boolean => {
  const isTripleStart = text.substring(i, i + 3) === "```"
  const isTripleMiddle = i > 0 && text.substring(i - 1, i + 2) === "```"
  const isTripleEnd = i > 1 && text.substring(i - 2, i + 1) === "```"

  return isTripleStart || isTripleMiddle || isTripleEnd
}

// Counts single backticks that are not part of triple backticks
const countSingleBackticks = (text: string): number => {
  let count = 0
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "`" && !isPartOfTripleBacktick(text, i)) {
      count++
    }
  }
  return count
}

// Completes incomplete inline code formatting (`)
// Avoids completing if inside an incomplete code block
const handleIncompleteInlineCode = (text: string): string => {
  // Check if we have inline triple backticks (starts with ``` and should end with ```)
  // This pattern should ONLY match truly inline code (no newlines)
  // Examples: ```code``` or ```python code```
  const inlineTripleBacktickMatch = text.match(/^```[^`\n]*```?$/)
  if (inlineTripleBacktickMatch && !text.includes("\n")) {
    // Check if it ends with exactly 2 backticks (incomplete)
    if (text.endsWith("``") && !text.endsWith("```")) {
      return `${text}\``
    }
    // Already complete inline triple backticks
    return text
  }

  // Check if we're inside a multi-line code block (complete or incomplete)
  const allTripleBackticks = (text.match(/```/g) || []).length
  const insideIncompleteCodeBlock = allTripleBackticks % 2 === 1

  // Don't modify text if we have complete multi-line code blocks (even pairs of ```)
  if (allTripleBackticks > 0 && allTripleBackticks % 2 === 0 && text.includes("\n")) {
    // We have complete multi-line code blocks, don't add any backticks
    return text
  }

  // Special case: if text ends with ```\n (triple backticks followed by newline)
  // This is actually a complete code block, not incomplete
  if (
    (text.endsWith("```\n") || text.endsWith("```")) && // Count all triple backticks - if even, it's complete
    allTripleBackticks % 2 === 0
  ) {
    return text
  }

  const inlineCodeMatch = text.match(inlineCodePattern)

  if (inlineCodeMatch && !insideIncompleteCodeBlock) {
    // Don't close if there's no meaningful content after the opening marker
    // inlineCodeMatch[2] contains the content after `
    // Check if content is only whitespace or other emphasis markers
    const contentAfterMarker = inlineCodeMatch[2]
    if (!contentAfterMarker || /^[\s_~*`]*$/.test(contentAfterMarker)) {
      return text
    }

    const singleBacktickCount = countSingleBackticks(text)
    if (singleBacktickCount % 2 === 1) {
      return `${text}\``
    }
  }

  return text
}

// Completes incomplete strikethrough formatting (~~)
const handleIncompleteStrikethrough = (text: string): string => {
  const strikethroughMatch = text.match(strikethroughPattern)

  if (strikethroughMatch) {
    // Don't close if there's no meaningful content after the opening markers
    // strikethroughMatch[2] contains the content after ~~
    // Check if content is only whitespace or other emphasis markers
    const contentAfterMarker = strikethroughMatch[2]
    if (!contentAfterMarker || /^[\s_~*`]*$/.test(contentAfterMarker)) {
      return text
    }

    const tildePairs = (text.match(/~~/g) || []).length
    if (tildePairs % 2 === 1) {
      return `${text}~~`
    }
  }

  return text
}

// Counts single dollar signs that are not part of double dollar signs and not escaped
const _countSingleDollarSigns = (text: string): number => {
  return text.split("").reduce((acc, char, index) => {
    if (char === "$") {
      const prevChar = text[index - 1]
      const nextChar = text[index + 1]
      // Skip if escaped with backslash
      if (prevChar === "\\") {
        return acc
      }
      if (prevChar !== "$" && nextChar !== "$") {
        return acc + 1
      }
    }
    return acc
  }, 0)
}

// Completes incomplete block KaTeX formatting ($$)
const handleIncompleteBlockKatex = (text: string): string => {
  // Count all $$ pairs in the text
  const dollarPairs = (text.match(/\$\$/g) || []).length

  // If we have an even number of $$, the block is complete
  if (dollarPairs % 2 === 0) {
    return text
  }

  // If we have an odd number, add closing $$
  // Check if this looks like a multi-line math block (contains newlines after opening $$)
  const firstDollarIndex = text.indexOf("$$")
  const hasNewlineAfterStart = firstDollarIndex !== -1 && text.includes("\n", firstDollarIndex)

  // For multi-line blocks, add newline before closing $$ if not present
  if (hasNewlineAfterStart && !text.endsWith("\n")) {
    return `${text}\n$$`
  }

  // For inline blocks or when already ending with newline, just add $$
  return `${text}$$`
}

// Counts triple asterisks that are not part of quadruple or more asterisks
const countTripleAsterisks = (text: string): number => {
  let count = 0
  const matches = text.match(/\*+/g) || []

  for (const match of matches) {
    // Count how many complete triple asterisks are in this sequence
    const asteriskCount = match.length
    if (asteriskCount >= 3) {
      // Each group of exactly 3 asterisks counts as one triple asterisk marker
      count += Math.floor(asteriskCount / 3)
    }
  }

  return count
}

// Completes incomplete bold-italic formatting (***)
const handleIncompleteBoldItalic = (text: string): string => {
  // Don't process if inside a complete code block
  if (hasCompleteCodeBlock(text)) {
    return text
  }

  // Don't process if text is only asterisks and has 4 or more consecutive asterisks
  // This prevents cases like **** from being treated as incomplete ***
  if (/^\*{4,}$/.test(text)) {
    return text
  }

  const boldItalicMatch = text.match(boldItalicPattern)

  if (boldItalicMatch) {
    // Don't close if there's no meaningful content after the opening markers
    // boldItalicMatch[2] contains the content after ***
    // Check if content is only whitespace or other emphasis markers
    const contentAfterMarker = boldItalicMatch[2]
    if (!contentAfterMarker || /^[\s_~*`]*$/.test(contentAfterMarker)) {
      return text
    }

    const tripleAsteriskCount = countTripleAsterisks(text)
    if (tripleAsteriskCount % 2 === 1) {
      return `${text}***`
    }
  }

  return text
}

// Parses markdown text and removes incomplete tokens to prevent partial rendering
export const parseIncompleteMarkdown = (text: string): string => {
  if (!text || typeof text !== "string") {
    return text
  }

  let result = text

  // Handle incomplete links and images first
  const processedResult = handleIncompleteLinksAndImages(result)

  // If we added an incomplete link marker, don't process other formatting
  // as the content inside the link should be preserved as-is
  if (processedResult.endsWith("](streamdown:incomplete-link)")) {
    return processedResult
  }

  result = processedResult

  // Handle various formatting completions
  // Handle triple asterisks first (most specific)
  result = handleIncompleteBoldItalic(result)
  // Normalize and guard the `<Use:` wrapper first so inner tags are handled correctly
  result = handleUseWrapper(result)
  // Handle custom mention tags trimming before other single-character completions
  result = handleIncompleteMentionTags(result)
  result = handleIncompleteBold(result)
  result = handleIncompleteDoubleUnderscoreItalic(result)
  result = handleIncompleteSingleAsteriskItalic(result)
  result = handleIncompleteSingleUnderscoreItalic(result)
  result = handleIncompleteInlineCode(result)
  result = handleIncompleteStrikethrough(result)

  // Handle KaTeX formatting (only block math with $$)
  result = handleIncompleteBlockKatex(result)
  // Note: We don't handle inline KaTeX with single $ as they're likely currency symbols

  return result
}
