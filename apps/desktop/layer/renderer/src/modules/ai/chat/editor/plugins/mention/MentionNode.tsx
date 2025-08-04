import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical"
import { $applyNodeReplacement, DecoratorNode } from "lexical"
import * as React from "react"

import type { MentionData } from "./types"

export type SerializedMentionNode = Spread<
  {
    mentionData: MentionData
  },
  SerializedLexicalNode
>

const MentionComponent = React.lazy(() =>
  import("./components/MentionComponent").then((module) => ({
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
    dom.dataset.lexicalMention = "true"
    dom.dataset.mentionType = this.__mentionData.type
    dom.dataset.mentionId = this.__mentionData.id
    return dom
  }

  override updateDOM(): false {
    return false
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!Object.hasOwn(domNode.dataset, "lexicalMention")) {
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
    element.dataset.lexicalMention = "true"
    element.dataset.mentionType = this.__mentionData.type
    element.dataset.mentionId = this.__mentionData.id
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

  /**
   * For export markdown conversion
   */
  override getTextContent(): string {
    return `[[ref:${this.__mentionData.type}:${this.__mentionData.value}]]`
  }

  override decorate(_editor: LexicalEditor): React.JSX.Element {
    return (
      <React.Suspense fallback={<span>@{this.__mentionData.name}</span>}>
        <MentionComponent mentionData={this.__mentionData} />
      </React.Suspense>
    )
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
  const mentionType = domNode.dataset.mentionType as MentionData["type"] | null
  const { mentionId } = domNode.dataset
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
    value: null,
  }

  const node = $createMentionNode(mentionData)
  return { node }
}

export function $createMentionNode(mentionData: MentionData): MentionNode {
  const mentionNode = new MentionNode(mentionData)
  return $applyNodeReplacement(mentionNode)
}

export function $isMentionNode(node: LexicalNode | null | undefined): node is MentionNode {
  return node instanceof MentionNode
}
