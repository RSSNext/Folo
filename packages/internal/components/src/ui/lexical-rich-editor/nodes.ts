import { CodeHighlightNode, CodeNode } from "@lexical/code"
import { LinkNode } from "@lexical/link"
import { ListItemNode, ListNode } from "@lexical/list"
import { MarkNode } from "@lexical/mark"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { ParagraphNode, TextNode } from "lexical"

// Mention functionality moved to desktop app, import should be handled there
// import { MentionNode } from "./plugins/mention"

export const LexicalRichEditorNodes = [
  // Core nodes
  ParagraphNode,
  TextNode,

  // Rich text nodes
  HeadingNode, // For HEADING transformer
  QuoteNode, // For QUOTE transformer

  // List nodes
  ListNode, // For UNORDERED_LIST, ORDERED_LIST transformers
  ListItemNode,

  // Code nodes
  CodeNode, // For CODE transformer (multiline)
  CodeHighlightNode, // For code syntax highlighting

  // Link nodes
  LinkNode, // For LINK transformer

  // Text format nodes
  MarkNode, // For HIGHLIGHT transformer
]
