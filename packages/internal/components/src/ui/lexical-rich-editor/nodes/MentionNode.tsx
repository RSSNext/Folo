import type { NodeKey, SerializedLexicalNode, Spread } from "lexical"
import {
  $applyNodeReplacement,
  DecoratorNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
} from "lexical"
import React from "react"

export type MentionType = "user" | "topic" | "channel"

export interface MentionData {
  id: string
  name: string
  type: MentionType
  avatar?: string
  description?: string
}

export type SerializedMentionNode = Spread<
  {
    mentionData: MentionData
  },
  SerializedLexicalNode
>

const MentionComponent = React.lazy(() =>
  import("../components/MentionComponent").then((module) => ({
    default: module.MentionComponent,
  })),
)

export class MentionNode extends DecoratorNode<React.JSX.Element> {
  __mentionData: MentionData

  static override getType(): string {
    return "mention"
  }

  static override clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__mentionData, node.__key)
  }

  constructor(mentionData: MentionData, key?: NodeKey) {
    super(key)
    this.__mentionData = mentionData
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement("span")
    dom.className = config.theme.mention || "mention-node"
    dom.setAttribute("data-lexical-mention", "true")
    dom.setAttribute("data-mention-type", this.__mentionData.type)
    dom.setAttribute("data-mention-id", this.__mentionData.id)
    return dom
  }

  override updateDOM(): false {
    return false
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-mention")) {
          return null
        }
        return {
          conversion: convertMentionElement,
          priority: 1,
        }
      },
    }
  }

  static override importJSON(serializedNode: SerializedMentionNode): MentionNode {
    const { mentionData } = serializedNode
    const node = $createMentionNode(mentionData)
    return node
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement("span")
    element.setAttribute("data-lexical-mention", "true")
    element.setAttribute("data-mention-type", this.__mentionData.type)
    element.setAttribute("data-mention-id", this.__mentionData.id)
    element.textContent = `@${this.__mentionData.name}`
    element.className = "mention-node"
    return { element }
  }

  override exportJSON(): SerializedMentionNode {
    return {
      mentionData: this.__mentionData,
      type: "mention",
      version: 1,
    }
  }

  override getTextContent(): string {
    return `@${this.__mentionData.name}`
  }

  override decorate(_editor: LexicalEditor, config: EditorConfig): React.JSX.Element {
    return (
      <React.Suspense fallback={<span>@{this.__mentionData.name}</span>}>
        <MentionComponent mentionData={this.__mentionData} />
      </React.Suspense>
    )
  }

  getMentionData(): MentionData {
    return this.__mentionData
  }

  setMentionData(mentionData: MentionData): void {
    const writable = this.getWritable()
    writable.__mentionData = mentionData
  }

  override isInline(): boolean {
    return true
  }

  override isKeyboardSelectable(): boolean {
    return false
  }

  canInsertTextBefore(): boolean {
    return false
  }

  canInsertTextAfter(): boolean {
    return true
  }

  canBeEmpty(): boolean {
    return false
  }

  isSegmented(): boolean {
    return true
  }

  extractWithChild(): boolean {
    return false
  }
}

function convertMentionElement(domNode: HTMLElement): DOMConversionOutput {
  const mentionType = domNode.getAttribute("data-mention-type") as MentionType | null
  const mentionId = domNode.getAttribute("data-mention-id")
  const textContent = domNode.textContent || ""
  
  if (!mentionType || !mentionId) {
    return { node: null }
  }

  // Extract name from text content (remove @ prefix)
  const name = textContent.startsWith("@") ? textContent.slice(1) : textContent

  const mentionData: MentionData = {
    id: mentionId,
    name,
    type: mentionType,
  }

  const node = $createMentionNode(mentionData)
  return { node }
}

export function $createMentionNode(mentionData: MentionData): MentionNode {
  const mentionNode = new MentionNode(mentionData)
  return $applyNodeReplacement(mentionNode)
}

export function $isMentionNode(
  node: LexicalNode | null | undefined,
): node is MentionNode {
  return node instanceof MentionNode
}