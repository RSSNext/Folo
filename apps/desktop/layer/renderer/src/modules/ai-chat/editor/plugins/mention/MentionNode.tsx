import i18next from "i18next"
import type {
  DOMConversionMap,
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

import { MentionComponent } from "./components/MentionComponent"
import { getDateMentionDisplayName } from "./hooks/dateMentionUtils"
import type { MentionData } from "./types"

export type SerializedMentionNode = Spread<
  {
    mentionData: MentionData
  },
  SerializedLexicalNode
>

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

  getMentionData(): MentionData {
    return this.__mentionData
  }

  setMentionData(mentionData: MentionData): void {
    const writable = this.getWritable()
    writable.__mentionData = mentionData
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
      span: () => {
        throw new Error("Not implemented")
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
    element.textContent = `@${resolveMentionDisplayName(this.__mentionData)}`
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
    return this.__mentionData.text
  }

  override decorate(editor: LexicalEditor): React.JSX.Element {
    // Use a combination of key and value to ensure re-render when mention data changes
    const dataKey =
      typeof this.__mentionData.value === "string"
        ? this.__mentionData.value
        : String(this.__mentionData.value)

    return (
      <React.Suspense fallback={null}>
        <MentionComponent
          mentionData={this.__mentionData}
          nodeKey={this.__key}
          editor={editor}
          key={`${this.__key}-${dataKey}`}
        />
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

export function $createMentionNode(mentionData: MentionData): MentionNode {
  const mentionNode = new MentionNode(mentionData)
  return $applyNodeReplacement(mentionNode)
}

export function $isMentionNode(node: LexicalNode | null | undefined): node is MentionNode {
  return node instanceof MentionNode
}

const resolveMentionDisplayName = (mentionData: MentionData): string => {
  if (mentionData.type !== "date") {
    return mentionData.name
  }

  const language = i18next.language || i18next.resolvedLanguage || i18next.options?.lng || "en"
  const translate = i18next.getFixedT(language, "ai")

  return getDateMentionDisplayName(mentionData, translate, language)
}
