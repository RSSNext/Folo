import { cn } from "@follow/utils/utils"
import * as React from "react"

export interface JsonHighlighterProps {
  /** JSON string to highlight */
  json: string
  /** Additional CSS class name */
  className?: string
  /** Whether to show indentation */
  showIndentation?: boolean
  /** Whether to show line numbers */
  showLineNumbers?: boolean
  /** Maximum height before scrolling */
  maxHeight?: string
}

/**
 * A lightweight JSON syntax highlighter component that uses regex matching
 * and TailwindCSS for styling without external highlighting libraries.
 */
export const JsonHighlighter = ({
  ref,
  json,
  className,
  showIndentation = true,
  showLineNumbers = false,
  maxHeight,
  ...props
}: JsonHighlighterProps & { ref?: React.RefObject<HTMLPreElement | null> }) => {
  const highlightedJson = React.useMemo(() => {
    try {
      // Try to parse and format the JSON first
      const parsed = JSON.parse(json)
      const formatted = JSON.stringify(parsed, null, showIndentation ? 2 : 0)
      return highlightJson(formatted)
    } catch {
      // If parsing fails, highlight the raw string
      return highlightJson(json)
    }
  }, [json, showIndentation])

  const lines = React.useMemo(() => {
    return highlightedJson.split("\n")
  }, [highlightedJson])

  return (
    <pre
      ref={ref}
      className={cn(
        "bg-material-ultra-thin text-text overflow-auto rounded-md border p-4 text-sm",
        "font-mono leading-relaxed",
        className,
      )}
      style={{ maxHeight }}
      {...props}
    >
      <code className="block">
        {showLineNumbers ? (
          <div className="flex">
            <div className="text-text-tertiary border-fill mr-4 select-none border-r pr-4">
              {lines.map((_, index) => (
                <div key={index} className="text-right">
                  {index + 1}
                </div>
              ))}
            </div>
            <div className="flex-1">
              {lines.map((line, index) => (
                <div key={index} dangerouslySetInnerHTML={{ __html: line }} />
              ))}
            </div>
          </div>
        ) : (
          lines.map((line, index) => <div key={index} dangerouslySetInnerHTML={{ __html: line }} />)
        )}
      </code>
    </pre>
  )
}

JsonHighlighter.displayName = "JsonHighlighter"

/**
 * Token types for JSON highlighting
 */
interface Token {
  type: "key" | "string" | "number" | "boolean" | "null" | "punctuation" | "whitespace"
  value: string
  start: number
  end: number
}

/**
 * Highlights JSON syntax using precise tokenization and UIKit colors
 */
function highlightJson(jsonString: string): string {
  // Escape HTML entities first
  const escaped = jsonString
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")

  const tokens = tokenizeJson(escaped)
  return renderTokens(tokens, escaped)
}

/**
 * Tokenizes JSON string into semantic tokens
 */
function tokenizeJson(json: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  // Track context to distinguish keys from string values
  const contextStack: ("object" | "array")[] = []
  let expectingKey = false

  while (i < json.length) {
    const char = json[i]!

    // Skip whitespace but track it for proper rendering
    if (/\s/.test(char)) {
      const start = i
      while (i < json.length && /\s/.test(json[i]!)) {
        i++
      }
      tokens.push({
        type: "whitespace",
        value: json.slice(start, i),
        start,
        end: i,
      })
      continue
    }

    // Handle strings (keys and values)
    if (char === '"') {
      const start = i
      i++ // Skip opening quote
      let value = '"'

      // Parse string content, handling escapes
      while (i < json.length) {
        const current = json[i]
        value += current

        if (current === '"') {
          i++
          break
        }

        // Handle escape sequences
        if (current === "\\" && i + 1 < json.length) {
          i++
          value += json[i]
        }
        i++
      }

      // Determine if this is a key or string value
      const isKey = expectingKey || (contextStack.at(-1) === "object" && isFollowedByColon(json, i))

      tokens.push({
        type: isKey ? "key" : "string",
        value,
        start,
        end: i,
      })

      if (isKey) {
        expectingKey = false
      }
      continue
    }

    // Handle numbers
    if (/[-\d]/.test(char)) {
      const start = i
      let value = ""

      // Handle negative sign
      if (char === "-") {
        value += char
        i++
      }

      // Parse integer part
      if (i < json.length && /\d/.test(json[i]!)) {
        while (i < json.length && /\d/.test(json[i]!)) {
          value += json[i]!
          i++
        }

        // Parse decimal part
        if (i < json.length && json[i] === ".") {
          value += json[i]!
          i++
          while (i < json.length && /\d/.test(json[i]!)) {
            value += json[i]!
            i++
          }
        }

        // Parse exponent part
        if (i < json.length && /e/i.test(json[i]!)) {
          value += json[i]!
          i++
          if (i < json.length && /[+-]/.test(json[i]!)) {
            value += json[i]!
            i++
          }
          while (i < json.length && /\d/.test(json[i]!)) {
            value += json[i]!
            i++
          }
        }

        tokens.push({
          type: "number",
          value,
          start,
          end: i,
        })
        continue
      } else {
        // Not a valid number, treat as punctuation
        tokens.push({
          type: "punctuation",
          value: char,
          start,
          end: i + 1,
        })
        i++
        continue
      }
    }

    // Handle boolean and null literals
    if (/[tfn]/.test(char)) {
      const start = i

      // Check for 'true'
      if (json.slice(i, i + 4) === "true") {
        tokens.push({
          type: "boolean",
          value: "true",
          start,
          end: i + 4,
        })
        i += 4
        continue
      }

      // Check for 'false'
      if (json.slice(i, i + 5) === "false") {
        tokens.push({
          type: "boolean",
          value: "false",
          start,
          end: i + 5,
        })
        i += 5
        continue
      }

      // Check for 'null'
      if (json.slice(i, i + 4) === "null") {
        tokens.push({
          type: "null",
          value: "null",
          start,
          end: i + 4,
        })
        i += 4
        continue
      }
    }

    // Handle punctuation
    if (/[{}[\],:]/.test(char)) {
      // Update context stack
      switch (char) {
        case "{": {
          contextStack.push("object")
          expectingKey = true

          break
        }
        case "[": {
          contextStack.push("array")

          break
        }
        case "}":
        case "]": {
          contextStack.pop()
          expectingKey = contextStack.at(-1) === "object"

          break
        }
        case ",": {
          expectingKey = contextStack.at(-1) === "object"

          break
        }
        case ":": {
          expectingKey = false

          break
        }
        // No default
      }

      tokens.push({
        type: "punctuation",
        value: char,
        start: i,
        end: i + 1,
      })
      i++
      continue
    }

    // Unknown character, skip
    i++
  }

  return tokens
}

/**
 * Checks if a string token is followed by a colon (indicating it's a key)
 */
function isFollowedByColon(json: string, startIndex: number): boolean {
  let i = startIndex

  // Skip whitespace
  while (i < json.length && /\s/.test(json[i]!)) {
    i++
  }

  return i < json.length && json[i] === ":"
}

/**
 * Renders tokens with appropriate UIKit colors
 */
function renderTokens(tokens: Token[], originalJson: string): string {
  let result = ""
  let lastEnd = 0

  for (const token of tokens) {
    // Add any characters between tokens (shouldn't happen with proper tokenization)
    if (token.start > lastEnd) {
      result += originalJson.slice(lastEnd, token.start)
    }

    // Apply semantic coloring with enhanced Tailwind colors
    switch (token.type) {
      case "key": {
        result += `<span class="text-sky-600 dark:text-sky-400 font-semibold">${token.value}</span>`
        break
      }
      case "string": {
        result += `<span class="text-emerald-600 dark:text-emerald-400">${token.value}</span>`
        break
      }
      case "number": {
        result += `<span class="text-amber-600 dark:text-amber-400">${token.value}</span>`
        break
      }
      case "boolean": {
        result += `<span class="text-violet-600 dark:text-violet-400 font-medium">${token.value}</span>`
        break
      }
      case "null": {
        result += `<span class="text-slate-500 dark:text-slate-400 italic">${token.value}</span>`
        break
      }
      case "punctuation": {
        // Use different colors for different punctuation types
        if (token.value === ":") {
          result += `<span class="text-slate-600 dark:text-slate-300">${token.value}</span>`
        } else if (/[{}[\]]/.test(token.value)) {
          result += `<span class="text-indigo-600 dark:text-indigo-400 font-semibold">${token.value}</span>`
        } else {
          result += `<span class="text-slate-500 dark:text-slate-400">${token.value}</span>`
        }
        break
      }
      case "whitespace": {
        result += token.value
        break
      }
      default: {
        result += token.value
        break
      }
    }

    lastEnd = token.end
  }

  // Add any remaining characters
  if (lastEnd < originalJson.length) {
    result += originalJson.slice(lastEnd)
  }

  return result
}
