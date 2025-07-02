import type { Element, Parent, Text } from "hast"
import type { Schema } from "hast-util-sanitize"
import type { Components } from "hast-util-to-jsx-runtime"
import { toJsxRuntime } from "hast-util-to-jsx-runtime"
import { toText } from "hast-util-to-text"
import { Fragment, jsx, jsxs } from "react/jsx-runtime"
import rehypeInferDescriptionMeta from "rehype-infer-description-meta"
import rehypeParse from "rehype-parse"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import rehypeStringify from "rehype-stringify"
import { unified } from "unified"
import type { Node } from "unist"
import { visit } from "unist-util-visit"
import { visitParents } from "unist-util-visit-parents"

type ParseHtmlOptions = {
  renderInlineStyle?: boolean
  noMedia?: boolean
  components?: Components
  scrollEnabled?: boolean
}

/**
 * Remove the last <br> element in the tree
 */
function rehypeTrimEndBrElement() {
  function trim(tree: Parent): void {
    if (!Array.isArray(tree.children) || tree.children.length === 0) {
      return
    }

    for (let i = tree.children.length - 1; i >= 0; i--) {
      const item = tree.children[i]!
      if (item.type === "element") {
        if (item.tagName === "br") {
          tree.children.pop()
          continue
        } else {
          trim(item)
        }
      }
      break
    }
  }
  return trim
}

export const parseHtml = (content: string, options?: ParseHtmlOptions) => {
  const { renderInlineStyle = false, noMedia = false, components } = options || {}

  const rehypeSchema: Schema = { ...defaultSchema }
  rehypeSchema.tagNames = [...rehypeSchema.tagNames!, "math"]

  if (noMedia) {
    rehypeSchema.tagNames = rehypeSchema.tagNames?.filter(
      (tag) => tag !== "img" && tag !== "picture",
    )
  } else {
    rehypeSchema.tagNames = [
      ...rehypeSchema.tagNames!,
      "video",
      "style",
      "figure",
      // SVG
      "svg",
      "g",
      "ellipse",
      "text",
      "polygon",
      "path",
      "title",
      "rect",
      "line",
      "circle",
      "use",
    ]
    rehypeSchema.attributes = {
      ...rehypeSchema.attributes,
      "*": renderInlineStyle
        ? [...rehypeSchema.attributes!["*"]!, "style", "class"]
        : rehypeSchema.attributes!["*"]!,
      video: ["src", "poster"],
      source: ["src", "type"],

      svg: [
        "width",
        "height",
        "viewBox",
        "xmlns",
        "version",
        "preserveAspectRatio",
        "xmlns:xlink",
        "xml:space",
        "fill",
        "stroke",
        "stroke-width",
      ],
      g: ["transform", "fill", "stroke", "stroke-width"],
      path: ["d", "fill", "stroke", "stroke-width", "transform"],
      polygon: ["points", "fill", "stroke", "stroke-width", "transform"],
      circle: ["cx", "cy", "r", "fill", "stroke", "stroke-width", "transform"],
      ellipse: ["cx", "cy", "rx", "ry", "fill", "stroke", "stroke-width", "transform"],
      rect: [
        "x",
        "y",
        "width",
        "height",
        "fill",
        "stroke",
        "stroke-width",
        "transform",
        "rx",
        "ry",
      ],
      line: ["x1", "y1", "x2", "y2", "stroke", "stroke-width", "transform"],
      text: ["x", "y", "fill", "font-size", "font-family", "text-anchor", "transform"],
      use: ["href", "xlink:href", "x", "y", "width", "height", "transform"],
    }
  }

  const pipeline = unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSanitize, rehypeSchema)
    .use(rehypeTrimEndBrElement)
    .use(rehypeInferDescriptionMeta)
    .use(rehypeStringify)

  const tree = pipeline.parse(content)

  rehypeUrlToAnchor(tree)

  // console.log("tree", tree)

  const hastTree = pipeline.runSync(tree, content)

  const images = [] as string[]

  visit(tree, "element", (node) => {
    if (node.tagName === "img" && node.properties.src) {
      images.push(node.properties.src as string)
    }
  })

  return {
    hastTree,
    images,
    toContent: () =>
      toJsxRuntime(hastTree, {
        Fragment,
        ignoreInvalidStyle: true,
        jsx: (type, props, key) => jsx(type as any, props, key),
        jsxs: (type, props, key) => jsxs(type as any, props, key),
        passNode: true,
        components,
      }),
    toText: () => toText(hastTree),
  }
}

function rehypeUrlToAnchor(tree: Node) {
  const tagsShouldNotBeWrapped = new Set(["a", "pre", "code"])
  // https://chatgpt.com/share/37e0ceec-5c9e-4086-b9d6-5afc1af13bb0
  visitParents(tree as any, "text", (node: Text, ancestors: Node[]) => {
    if (
      ancestors.some(
        (ancestor) =>
          "tagName" in ancestor && tagsShouldNotBeWrapped.has((ancestor as Element).tagName),
      )
    ) {
      return
    }

    const parent = ancestors.at(-1)

    const urlRegex = /https?:\/\/\S+/g
    const text = node.value
    const matches = [...text.matchAll(urlRegex)]

    if (matches.length === 0 || !parent || !("children" in parent)) return

    if ((parent as Element).tagName === "a") {
      return
    }

    const newNodes: (Text | Element)[] = []
    let lastIndex = 0

    matches.forEach((match) => {
      const [url] = match
      const urlIndex = match.index || 0

      if (urlIndex > lastIndex) {
        newNodes.push({
          type: "text",
          value: text.slice(lastIndex, urlIndex),
        })
      }

      newNodes.push({
        type: "element",
        tagName: "a",
        properties: { href: url },
        children: [{ type: "text", value: url }],
      })

      lastIndex = urlIndex + url.length
    })

    if (lastIndex < text.length) {
      newNodes.push({
        type: "text",
        value: text.slice(lastIndex),
      })
    }

    const index = (parent.children as (Text | Element)[]).indexOf(node)
    ;(parent.children as (Text | Element)[]).splice(index, 1, ...newNodes)
  })
}
