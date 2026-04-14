import type { SpotlightRule } from "@follow/shared/spotlight"
import { spotlightHighlightOpacityHex } from "@follow/shared/spotlight"
import type { Element, Parent, Root, Text } from "hast"
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
import { visit } from "unist-util-visit"
import { visitParents } from "unist-util-visit-parents"

import { buildHighlightSegments, compileSpotlightRules } from "./spotlight"

type ParseHtmlOptions = {
  renderInlineStyle?: boolean
  noMedia?: boolean
  components?: Components
  scrollEnabled?: boolean
  hastTransform?: (tree: Root) => void
}

type CompatibleVisitTree = Parameters<typeof visit>[0]
type CompatibleVisitParentsTree = Parameters<typeof visitParents>[0]
type CompatibleAncestor = Element | Parent | Root | Text

const spotlightExcludedTagNames = new Set([
  "code",
  "pre",
  "kbd",
  "samp",
  "style",
  "script",
  "title",
])

const svgTextContextTagNames = new Set(["text", "tspan"])

const toSpotlightStyle = (color: string) =>
  `background-color:${color}${spotlightHighlightOpacityHex};border-radius:4px;padding-inline:1px;`

type TextNodeTransformer = (node: Text, context: { ancestors: Element[] }) => Array<Element | Text>

const transformHastTextNodes = (
  tree: Parent,
  transformer: TextNodeTransformer,
  ancestors: Element[] = [],
) => {
  if (!Array.isArray(tree.children) || tree.children.length === 0) return

  const nextChildren: Parent["children"] = []

  for (const child of tree.children) {
    if (child.type === "text") {
      nextChildren.push(...transformer(child, { ancestors }))
      continue
    }

    nextChildren.push(child)

    if (child.type === "element") {
      transformHastTextNodes(child, transformer, [...ancestors, child])
      continue
    }

    if ("children" in child && Array.isArray(child.children)) {
      transformHastTextNodes(child as Parent, transformer, ancestors)
    }
  }

  tree.children = nextChildren
}

export const applySpotlightToHast = (tree: Root, rules: SpotlightRule[]) => {
  const compiledRules = compileSpotlightRules(rules)
  if (compiledRules.length === 0) return

  transformHastTextNodes(tree, (node, { ancestors }) => {
    if (ancestors.some((ancestor) => spotlightExcludedTagNames.has(ancestor.tagName))) {
      return [node]
    }

    const isSvgSubtree = ancestors.some((ancestor) => ancestor.tagName === "svg")
    const isVisibleSvgTextContext = ancestors.some((ancestor) =>
      svgTextContextTagNames.has(ancestor.tagName),
    )

    if (isSvgSubtree && !isVisibleSvgTextContext) {
      return [node]
    }

    const segments = buildHighlightSegments(node.value, compiledRules)
    if (segments.length === 1 && !segments[0]?.highlight) {
      return [node]
    }

    return segments.map((segment) =>
      segment.highlight
        ? {
            type: "element",
            tagName: isVisibleSvgTextContext ? "tspan" : "span",
            properties: {
              "data-spotlight-rule-id": segment.highlight.ruleId,
              "data-spotlight-color": segment.highlight.color,
              style: toSpotlightStyle(segment.highlight.color),
            },
            children: [{ type: "text", value: segment.text }],
          }
        : {
            type: "text",
            value: segment.text,
          },
    )
  })
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
  const { renderInlineStyle = false, noMedia = false, components, hastTransform } = options || {}

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
      "iframe",
      "style",
      "figure",
      // SVG
      "svg",
      "g",
      "ellipse",
      "text",
      "tspan",
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
      iframe: [
        "src",
        "width",
        "height",
        "frameborder",
        "allowfullscreen",
        "sandbox",
        "loading",
        "title",
        "id",
        "class",
      ],
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
      tspan: ["x", "y", "dx", "dy", "fill", "font-size", "font-family", "text-anchor", "transform"],
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

  rehypeUrlToAnchor(tree as CompatibleVisitParentsTree)

  // console.log("tree", tree)

  const hastTree = pipeline.runSync(tree, content) as Root
  hastTransform?.(hastTree as Root)

  const images = [] as string[]

  visit(hastTree as CompatibleVisitTree, "element", (node) => {
    const element = node as Element

    if (element.tagName === "img" && typeof element.properties.src === "string") {
      images.push(element.properties.src)
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

function rehypeUrlToAnchor(tree: CompatibleVisitParentsTree) {
  const tagsShouldNotBeWrapped = new Set(["a", "pre", "code"])
  // https://chatgpt.com/share/37e0ceec-5c9e-4086-b9d6-5afc1af13bb0
  visitParents(tree, "text", (node, ancestors) => {
    const textNode = node as Text
    const typedAncestors = ancestors as CompatibleAncestor[]

    if (
      typedAncestors.some(
        (ancestor) =>
          "tagName" in ancestor && tagsShouldNotBeWrapped.has((ancestor as Element).tagName),
      )
    ) {
      return
    }

    const parent = typedAncestors.at(-1)

    const urlRegex = /https?:\/\/\S+/g
    const text = textNode.value
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

    const index = (parent.children as (Text | Element)[]).indexOf(textNode)
    ;(parent.children as (Text | Element)[]).splice(index, 1, ...newNodes)
  })
}
