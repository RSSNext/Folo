import { RemoveWrapperFunction } from "unplugin-ast/transformers"
import AST from "unplugin-ast/vite"

export const astPlugin = AST({
  transformer: [
    RemoveWrapperFunction(["tw", "defineSettingPageData", "t_", "tShortcuts", "tSettings"]),
  ],
})
