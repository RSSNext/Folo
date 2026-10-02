import type { Transformer } from "unplugin-ast"
import { RemoveWrapperFunction } from "unplugin-ast/transformers"
import AST from "unplugin-ast/vite"
import type { TaggedTemplateExpression } from "unplugin-ast/yuku"

// Custom transformer for tw function that compresses template strings
export const TwTransformer: Transformer<TaggedTemplateExpression> = {
  onNode: (node): node is TaggedTemplateExpression =>
    node.type === "TaggedTemplateExpression" &&
    node.tag.type === "Identifier" &&
    node.tag.name === "tw",
  transform(node) {
    const { quasi } = node
    const firstPart = quasi.quasis[0]
    if (firstPart) {
      const compressedString = firstPart.value.raw.replaceAll(/\s+/g, " ").trim()
      firstPart.value.raw = compressedString
      firstPart.value.cooked = compressedString
    }
    return quasi
  },
}

export const astPlugin = AST({
  transformer: [
    TwTransformer,
    RemoveWrapperFunction([
      "defineSettingPageData",
      "t_",
      "tShortcuts",
      "tSettings",
      "defineFollowCommand",
    ]),
  ],
})
