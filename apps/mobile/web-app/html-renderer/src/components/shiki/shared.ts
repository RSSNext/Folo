import {
  transformerMetaHighlight,
  transformerNotationDiff,
  transformerNotationHighlight,
} from "@shikijs/transformers"
import type { ShikiTransformer } from "shiki"
import { createHighlighterCoreSync, createJavaScriptRegexEngine } from "shiki"

export const shikiTransformers: ShikiTransformer[] = [
  transformerMetaHighlight(),
  transformerNotationDiff({ matchAlgorithm: "v3" }),
  transformerNotationHighlight({ matchAlgorithm: "v3" }),
]

const js = createJavaScriptRegexEngine()
export const shiki = createHighlighterCoreSync({
  themes: [],
  langs: [],
  engine: js,
})
