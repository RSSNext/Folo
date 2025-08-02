export { createDefaultLexicalEditor, createLexicalEditor } from "./editor"
export { LexicalRichEditor } from "./LexicalRichEditor"
export { LexicalRichEditorNodes } from "./nodes"
export { KeyboardPlugin, MentionPlugin, MENTION_COMMAND, MENTION_TYPEAHEAD_COMMAND } from "./plugins"
export { defaultLexicalTheme } from "./theme"
export type { LexicalRichEditorProps, LexicalRichEditorRef } from "./types"

// Mention system exports
export { MentionNode, $createMentionNode, $isMentionNode } from "./nodes/MentionNode"
export type { MentionData, MentionType, SerializedMentionNode } from "./nodes/MentionNode"
export { MentionComponent } from "./components/MentionComponent"
export { MentionDropdown } from "./components/MentionDropdown"
export type { MentionPluginProps, MentionMatch } from "./plugins"

// Mention utilities and types
export * from "./utils/mention-utils"
export * from "./types/mention-types"
