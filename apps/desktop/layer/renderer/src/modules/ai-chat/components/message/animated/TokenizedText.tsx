/**
 * @see https://github.com/Ephibbs/flowtoken/blob/main/src/components/SplitText.tsx
 */
import type { ReactElement } from "react"
import * as React from "react"
import { useEffect, useRef } from "react"

import { ANIMATION_STYLE } from "./constants"

interface TokenWithSource {
  text: string
  source: number
}
// Helper function to check if token is a TokenWithSource type
const isTokenWithSource = (token: TokenType): token is TokenWithSource => {
  return token !== null && typeof token === "object" && "text" in token && "source" in token
}
type TokenType = string | TokenWithSource | ReactElement

export const TokenizedText = ({ input }: { input: React.ReactNode }) => {
  // Track previous input to detect changes
  const prevInputRef = useRef<string>("")
  // Track tokens with their source for proper keying in diff mode
  const tokensWithSources = useRef<TokenWithSource[]>([])

  // For detecting and handling duplicated content
  const fullTextRef = useRef<string>("")

  const tokens = React.useMemo(() => {
    if (React.isValidElement(input)) return [input]

    if (typeof input !== "string") return null

    // If this is the first render or we've gone backward, reset everything
    if (!prevInputRef.current || input.length < prevInputRef.current.length) {
      tokensWithSources.current = []
      fullTextRef.current = ""
    }

    // Only process input if it's different from previous
    if (input !== prevInputRef.current) {
      // Find the true unique content by comparing with our tracked full text
      // This handles cases where the input contains duplicates

      // First check if we're just seeing the same content repeated
      if (input.includes(fullTextRef.current)) {
        const uniqueNewContent = input.slice(fullTextRef.current.length)

        // Only add if there's actual new content
        if (uniqueNewContent.length > 0) {
          tokensWithSources.current.push({
            text: uniqueNewContent,
            source: tokensWithSources.current.length,
          })

          // Update our full text tracking
          fullTextRef.current = input
        }
      } else {
        // Handle case when input completely changes
        // Just take the whole thing as a new token
        tokensWithSources.current = [
          {
            text: input,
            source: 0,
          },
        ]
        fullTextRef.current = input
      }
    }

    // Return the tokensWithSources directly
    return tokensWithSources.current
  }, [input])

  // Update previous input after processing
  useEffect(() => {
    if (typeof input === "string") {
      prevInputRef.current = input
    }
  }, [input])

  return (
    <>
      {tokens?.map((token, index) => {
        // Determine the key and text based on token type
        let key = index
        let text = ""

        if (isTokenWithSource(token)) {
          key = token.source
          text = token.text
        } else if (typeof token === "string") {
          key = index
          text = token
        } else if (React.isValidElement(token)) {
          key = index
          text = ""
          return React.cloneElement(token, { key })
        }

        // Skip rendering completely empty tokens
        if (text.length === 0) {
          return null
        }

        // For whitespace-only tokens, preserve spacing without adding a DOM element
        if (/^\s+$/.test(text)) {
          return <React.Fragment key={key}>{text}</React.Fragment>
        }

        return (
          <span key={key} className="inline whitespace-pre-wrap" style={ANIMATION_STYLE}>
            {text}
          </span>
        )
      })}
    </>
  )
}
