import { CodeHighlightNode, CodeNode } from "@lexical/code"
import { AutoLinkNode, LinkNode } from "@lexical/link"
import { ListItemNode, ListNode } from "@lexical/list"
import { MarkNode } from "@lexical/mark"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { ParagraphNode, TextNode } from "lexical"

export const LexicalRichEditorNodes = [
  ParagraphNode,
  TextNode,
  AutoLinkNode,
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  LinkNode,
  MarkNode,
  CodeHighlightNode,
]
