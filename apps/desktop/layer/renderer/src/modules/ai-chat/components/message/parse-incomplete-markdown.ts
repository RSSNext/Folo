// @see https://github.com/vercel/streamdown/blob/main/packages/streamdown/lib/parse-incomplete-markdown.ts
const linkImagePattern = /(!?\[)([^\]]*)$/
const boldPattern = /(\*\*)([^*]*)$/
const italicPattern = /(__)([^_]*)$/
const boldItalicPattern = /(\*\*\*)([^*]*)$/
const singleAsteriskPattern = /(\*)([^*]*)$/
const singleUnderscorePattern = /(_)([^_]*)$/
const inlineCodePattern = /(`)([^`]*)$/
const strikethroughPattern = /(~~)([^~]*)$/
const inlineKatexPattern = /(\$)([^$]*)$/
const blockKatexPattern = /(\$\$)([^$]*)$/

// Handles incomplete links and images by removing them if not closed
const handleIncompleteLinksAndImages = (text: string): string => {
  const linkMatch = text.match(linkImagePattern)

  if (linkMatch) {
    const startIndex = text.lastIndexOf(linkMatch[1]!)
    return text.slice(0, Math.max(0, startIndex))
  }

  return text
}

// Completes incomplete bold formatting (**)
const handleIncompleteBold = (text: string): string => {
  const boldMatch = text.match(boldPattern)

  if (boldMatch) {
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
    const underscorePairs = (text.match(/__/g) || []).length
    if (underscorePairs % 2 === 1) {
      return `${text}__`
    }
  }

  return text
}

// Counts single asterisks that are not part of double asterisks and not escaped
const countSingleAsterisks = (text: string): number => {
  return text.split("").reduce((acc, char, index) => {
    if (char === "*") {
      const prevChar = text[index - 1]
      const nextChar = text[index + 1]
      // Skip if escaped with backslash
      if (prevChar === "\\") {
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
  const singleAsteriskMatch = text.match(singleAsteriskPattern)

  if (singleAsteriskMatch) {
    const singleAsterisks = countSingleAsterisks(text)
    if (singleAsterisks % 2 === 1) {
      return `${text}*`
    }
  }

  return text
}

// Counts single underscores that are not part of double underscores and not escaped
const countSingleUnderscores = (text: string): number => {
  return text.split("").reduce((acc, char, index) => {
    if (char === "_") {
      const prevChar = text[index - 1]
      const nextChar = text[index + 1]
      // Skip if escaped with backslash
      if (prevChar === "\\") {
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
  const singleUnderscoreMatch = text.match(singleUnderscorePattern)

  if (singleUnderscoreMatch) {
    const singleUnderscores = countSingleUnderscores(text)
    if (singleUnderscores % 2 === 1) {
      return `${text}_`
    }
  }

  return text
}

// Checks if a backtick at position i is part of a triple backtick sequence
const isPartOfTripleBacktick = (text: string, i: number): boolean => {
  const isTripleStart = text.slice(i, i + 3) === "```"
  const isTripleMiddle = i > 0 && text.slice(i - 1, i + 2) === "```"
  const isTripleEnd = i > 1 && text.slice(i - 2, i + 1) === "```"

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
      return `${text}` + "`"
    }
    // Already complete inline triple backticks
    return text
  }

  // Check if we're inside a multi-line code block (complete or incomplete)
  const allTripleBackticks = (text.match(/```/g) || []).length
  const insideIncompleteCodeBlock = allTripleBackticks % 2 === 1

  // Special case: if text ends with ```\n (triple backticks followed by newline)
  // This is actually a complete code block, not incomplete
  if (
    (text.endsWith("```\n") || text.endsWith("```")) && // Count all triple backticks - if even, it's complete
    allTripleBackticks % 2 === 0
  ) {
    return text
  }

  // Don't modify text if we have complete multi-line code blocks (even pairs of ```)
  if (allTripleBackticks > 0 && allTripleBackticks % 2 === 0 && text.includes("\n")) {
    // We have complete multi-line code blocks, don't add any backticks
    return text
  }

  const inlineCodeMatch = text.match(inlineCodePattern)

  if (inlineCodeMatch && !insideIncompleteCodeBlock) {
    const singleBacktickCount = countSingleBackticks(text)
    if (singleBacktickCount % 2 === 1) {
      return `${text}` + "`"
    }
  }

  return text
}

// Completes incomplete strikethrough formatting (~~)
const handleIncompleteStrikethrough = (text: string): string => {
  const strikethroughMatch = text.match(strikethroughPattern)

  if (strikethroughMatch) {
    const tildePairs = (text.match(/~~/g) || []).length
    if (tildePairs % 2 === 1) {
      return `${text}~~`
    }
  }

  return text
}

// Counts single dollar signs that are not part of double dollar signs and not escaped
const countSingleDollarSigns = (text: string): number => {
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
  const blockKatexMatch = text.match(blockKatexPattern)

  if (blockKatexMatch) {
    const dollarPairs = (text.match(/\$\$/g) || []).length
    if (dollarPairs % 2 === 1) {
      return `${text}$$`
    }
  }

  return text
}

// Completes incomplete inline KaTeX formatting ($)
const handleIncompleteInlineKatex = (text: string): string => {
  const inlineKatexMatch = text.match(inlineKatexPattern)

  if (inlineKatexMatch) {
    const singleDollars = countSingleDollarSigns(text)
    if (singleDollars % 2 === 1) {
      return `${text}$`
    }
  }

  return text
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
  // Don't process if text is only asterisks and has 4 or more consecutive asterisks
  // This prevents cases like **** from being treated as incomplete ***
  if (/^\*{4,}$/.test(text)) {
    return text
  }

  const boldItalicMatch = text.match(boldItalicPattern)

  if (boldItalicMatch) {
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

  // Handle incomplete links and images first (removes content)
  result = handleIncompleteLinksAndImages(result)

  // Handle various formatting completions
  // Handle triple asterisks first (most specific)
  result = handleIncompleteBoldItalic(result)
  result = handleIncompleteBold(result)
  result = handleIncompleteDoubleUnderscoreItalic(result)
  result = handleIncompleteSingleAsteriskItalic(result)
  result = handleIncompleteSingleUnderscoreItalic(result)
  result = handleIncompleteInlineCode(result)
  result = handleIncompleteStrikethrough(result)

  // Handle KaTeX formatting (block first, then inline)
  result = handleIncompleteBlockKatex(result)
  result = handleIncompleteInlineKatex(result)

  return result
}
