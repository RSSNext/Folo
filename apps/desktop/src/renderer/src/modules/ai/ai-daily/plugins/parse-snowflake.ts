import type { Parent } from "mdast"
import type { Node } from "unist"
import { visit } from "unist-util-visit"

interface SnowflakeOptions {
  component?: string
}

const SNOWFLAKE_PATTERN = /\[(\d{15,20})\]/g

function isTextNode(node: Node): node is { type: "text"; value: string } {
  return node.type === "text"
}

export function remarkSnowflakeId(options: SnowflakeOptions = {}) {
  const { component = "snowflake-id" } = options

  return (tree: Node) => {
    let idIndex = 1
    visit(tree, "text", (node, index, parent: Parent) => {
      if (!isTextNode(node) || !parent) return

      const { value } = node as { value: string }
      const matches = Array.from(value.matchAll(SNOWFLAKE_PATTERN))

      if (matches.length === 0) return

      const result: (Node | string)[] = []
      let lastIndex = 0

      for (const match of matches) {
        if (!Array.isArray(match)) continue

        const [fullMatch, snowflakeId] = match
        const matchIndex = match.index!

        // Add text before the match
        if (matchIndex > lastIndex) {
          result.push({
            type: "text",
            // @ts-expect-error
            value: value.slice(lastIndex, matchIndex),
          })
        }

        // Add snowflake node
        result.push({
          type: "snowflakeId",
          data: {
            hName: component,
            hProperties: {
              id: snowflakeId,
              index: idIndex++,
            },
          },
          // @ts-expect-error
          children: [
            {
              type: "text",
              value: fullMatch,
            },
          ],
        })

        lastIndex = matchIndex + fullMatch.length
      }

      // Add any remaining text after the last match
      if (lastIndex < value.length) {
        result.push({
          type: "text",
          // @ts-expect-error
          value: value.slice(lastIndex),
        })
      }

      // Replace the current node with the new nodes
      // @ts-expect-error
      parent.children.splice(index, 1, ...result)
    })
  }
}
