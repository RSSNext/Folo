export { createDefaultLexicalEditor, createLexicalEditor } from "./editor"
export { LexicalRichEditor } from "./LexicalRichEditor"
export { LexicalRichEditorNodes } from "./nodes"
export {
  KeyboardPlugin,
  MENTION_COMMAND,
  MENTION_TYPEAHEAD_COMMAND,
  MentionPlugin,
} from "./plugins"
export { defaultLexicalTheme } from "./theme"
export type { LexicalRichEditorProps, LexicalRichEditorRef } from "./types"

// Mention system exports
export type { MentionMatch,MentionPluginProps } from "./plugins"
export type { MentionData, MentionType } from "./plugins/mention"
export { $createMentionNode, $isMentionNode,MentionNode } from "./plugins/mention"
export { MentionComponent } from "./plugins/mention"
export { MentionDropdown } from "./plugins/mention"
export type { SerializedMentionNode } from "./plugins/mention/MentionNode"

// Mention utilities and types
export * from "./types/mention-types"
export * from "./utils/mention-utils"
