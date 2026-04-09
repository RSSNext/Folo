import type { SpotlightRule } from "@follow/shared/spotlight"
import type { Root } from "hast"
import { createStore } from "jotai"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { entryAtom, spotlightAtom } from "./atoms"
import { WebViewBridgeManager } from "./managers/webview-bridge"
import { applySpotlightToHtmlRendererTree } from "./spotlight"

const spotlightRules: SpotlightRule[] = [
  {
    id: "alpha-rule",
    enabled: true,
    pattern: "alpha",
    patternType: "keyword",
    caseSensitive: false,
    color: "#ffcc00",
  },
]

describe("applySpotlightToHtmlRendererTree", () => {
  test("highlights visible text nodes and skips non-visible or code-oriented content", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "p",
          properties: {},
          children: [
            { type: "text", value: "alpha " },
            {
              type: "element",
              tagName: "code",
              properties: {},
              children: [{ type: "text", value: "alpha" }],
            },
            { type: "text", value: " omega" },
          ],
        },
        {
          type: "element",
          tagName: "pre",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "code",
              properties: {},
              children: [{ type: "text", value: "alpha" }],
            },
          ],
        },
        {
          type: "element",
          tagName: "kbd",
          properties: {},
          children: [{ type: "text", value: "alpha" }],
        },
        {
          type: "element",
          tagName: "style",
          properties: {},
          children: [{ type: "text", value: ".alpha { color: red; }" }],
        },
        {
          type: "element",
          tagName: "script",
          properties: {},
          children: [{ type: "text", value: "const alpha = true" }],
        },
        {
          type: "element",
          tagName: "svg",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "text",
              properties: {},
              children: [{ type: "text", value: "alpha" }],
            },
            {
              type: "element",
              tagName: "title",
              properties: {},
              children: [{ type: "text", value: "alpha icon" }],
            },
          ],
        },
        {
          type: "element",
          tagName: "title",
          properties: {},
          children: [{ type: "text", value: "alpha metadata" }],
        },
      ],
    }

    applySpotlightToHtmlRendererTree(tree, spotlightRules)

    const paragraph = tree.children[0]
    const pre = tree.children[1]
    const kbd = tree.children[2]
    const style = tree.children[3]
    const script = tree.children[4]
    const svg = tree.children[5]
    const title = tree.children[6]

    expect(paragraph).toMatchObject({
      type: "element",
      tagName: "p",
      children: [
        {
          type: "element",
          tagName: "span",
          properties: expect.objectContaining({
            "data-spotlight-rule-id": "alpha-rule",
            style: "background-color:#ffcc00CC;border-radius:5px;padding-inline:2px;",
          }),
          children: [{ type: "text", value: "alpha" }],
        },
        { type: "text", value: " " },
        {
          type: "element",
          tagName: "code",
          children: [{ type: "text", value: "alpha" }],
        },
        { type: "text", value: " omega" },
      ],
    })
    expect(pre).toMatchObject({
      type: "element",
      tagName: "pre",
      children: [
        {
          type: "element",
          tagName: "code",
          children: [{ type: "text", value: "alpha" }],
        },
      ],
    })
    expect(kbd).toMatchObject({
      type: "element",
      tagName: "kbd",
      children: [{ type: "text", value: "alpha" }],
    })
    expect(style).toMatchObject({
      type: "element",
      tagName: "style",
      children: [{ type: "text", value: ".alpha { color: red; }" }],
    })
    expect(script).toMatchObject({
      type: "element",
      tagName: "script",
      children: [{ type: "text", value: "const alpha = true" }],
    })
    expect(svg).toMatchObject({
      type: "element",
      tagName: "svg",
      children: [
        {
          type: "element",
          tagName: "text",
          children: [
            {
              type: "element",
              tagName: "tspan",
              properties: expect.objectContaining({
                "data-spotlight-rule-id": "alpha-rule",
                style: "background-color:#ffcc00CC;border-radius:5px;padding-inline:2px;",
              }),
              children: [{ type: "text", value: "alpha" }],
            },
          ],
        },
        {
          type: "element",
          tagName: "title",
          children: [{ type: "text", value: "alpha icon" }],
        },
      ],
    })
    expect(title).toMatchObject({
      type: "element",
      tagName: "title",
      children: [{ type: "text", value: "alpha metadata" }],
    })
  })
})

describe("WebViewBridgeManager", () => {
  beforeEach(() => {
    ;(globalThis as { bridge?: { measure: ReturnType<typeof vi.fn> } }).bridge = {
      measure: vi.fn(),
    }
  })

  test("restores spotlight rules from the entry payload", () => {
    const store = createStore()
    const manager = new WebViewBridgeManager(store)

    manager.setEntry({
      content: "alpha content",
      spotlightRules,
    })

    expect(store.get(entryAtom)).toMatchObject({
      content: "alpha content",
      spotlightRules,
    })
    expect(store.get(spotlightAtom)).toEqual(spotlightRules)
  })
})
