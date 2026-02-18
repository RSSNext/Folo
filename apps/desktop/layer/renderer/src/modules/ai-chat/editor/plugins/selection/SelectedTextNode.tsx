import type {
  DOMConversionMap,
  DOMExportOutput,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical"
import { DecoratorNode } from "lexical"
import * as React from "react"

import { SelectedTextNodeComponent } from "./SelectedTextNodeComponent"

export type SelectedTextNodePayload = {
  text: string
  sourceEntryId?: string
  timestamp?: number
}

export type SerializedSelectedTextNode = Spread<SelectedTextNodePayload, SerializedLexicalNode>

export class SelectedTextNode extends DecoratorNode<React.JSX.Element> {
  __text: string
  __sourceEntryId?: string
  __timestamp?: number

  static override getType(): string {
    return "selected-text"
  }

  static override clone(node: SelectedTextNode): SelectedTextNode {
    return new SelectedTextNode(node.__text, node.__sourceEntryId, node.__timestamp, node.__key)
  }

  constructor(text: string, sourceEntryId?: string, timestamp?: number, key?: NodeKey) {
    super(key)
    this.__text = text
    this.__sourceEntryId = sourceEntryId
    this.__timestamp = timestamp
  }

  getText(): string {
    return this.__text
  }

  setText(text: string): void {
    const writable = this.getWritable()
    writable.__text = text
  }

  getSourceEntryId(): string | undefined {
    return this.__sourceEntryId
  }

  getTimestamp(): number | undefined {
    return this.__timestamp
  }

  override createDOM(): HTMLElement {
    const div = document.createElement("div")
    div.dataset.selectedTextNode = "true"
    return div
  }

  override updateDOM(): false {
    return false
  }

  static override importDOM(): DOMConversionMap | null {
    return null
  }

  static override importJSON(serializedNode: SerializedSelectedTextNode): SelectedTextNode {
    const { text, sourceEntryId, timestamp } = serializedNode
    return $createSelectedTextNode({ text, sourceEntryId, timestamp })
  }

  override exportJSON(): SerializedSelectedTextNode {
    return {
      text: this.__text,
      sourceEntryId: this.__sourceEntryId,
      timestamp: this.__timestamp,
      type: "selected-text",
      version: 1,
    }
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement("div")
    element.dataset.selectedTextNode = "true"
    element.textContent = this.__text
    return { element }
  }

  override decorate(_editor: LexicalEditor): React.JSX.Element {
    return (
      <SelectedTextNodeComponent
        text={this.__text}
        sourceEntryId={this.__sourceEntryId}
        timestamp={this.__timestamp}
      />
    )
  }

  override isInline(): boolean {
    return false
  }

  override isKeyboardSelectable(): boolean {
    return false
  }

  override getTextContent(): string {
    return `<user-selection>${escapeXML(this.__text)}</user-selection>`
  }
}

export function $createSelectedTextNode(payload: SelectedTextNodePayload): SelectedTextNode {
  return new SelectedTextNode(payload.text, payload.sourceEntryId, payload.timestamp)
}

export function $isSelectedTextNode(
  node: LexicalNode | null | undefined,
): node is SelectedTextNode {
  return node instanceof SelectedTextNode
}
function escapeXML(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}
