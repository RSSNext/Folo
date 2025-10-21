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

import { ShortcutComponent } from "./components/ShortcutComponent"
import type { ShortcutData } from "./types"
import { getShortcutTextValue } from "./utils/shortcutTextValue"

export type SerializedShortcutNode = Spread<
  {
    shortcutData: ShortcutData
  },
  SerializedLexicalNode
>

export class ShortcutNode extends DecoratorNode<React.JSX.Element> {
  __shortcutData: ShortcutData

  static override getType(): string {
    return "shortcut"
  }

  static override clone(node: ShortcutNode): ShortcutNode {
    return new ShortcutNode(node.__shortcutData, node.__key)
  }

  constructor(shortcutData: ShortcutData, key?: NodeKey) {
    super(key)
    this.__shortcutData = shortcutData
  }

  getShortcutData(): ShortcutData {
    return this.__shortcutData
  }

  setShortcutData(shortcutData: ShortcutData): void {
    const writable = this.getWritable()
    writable.__shortcutData = shortcutData
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement("span")
    dom.className = config.theme.mention || "shortcut-node"
    dom.dataset.lexicalShortcut = "true"
    dom.dataset.shortcutId = this.__shortcutData.id
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

  static override importJSON(serializedNode: SerializedShortcutNode): ShortcutNode {
    const { shortcutData } = serializedNode
    return $createShortcutNode(shortcutData)
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement("span")
    element.dataset.lexicalShortcut = "true"
    element.dataset.shortcutId = this.__shortcutData.id
    element.textContent = `/${this.__shortcutData.name}`
    element.className = "shortcut-node"
    return { element }
  }

  override exportJSON(): SerializedShortcutNode {
    return {
      shortcutData: this.__shortcutData,
      type: "shortcut",
      version: 1,
    }
  }

  override getTextContent(): string {
    return getShortcutTextValue(this.__shortcutData)
  }

  override decorate(_editor: LexicalEditor): React.JSX.Element {
    const dataKey = this.__shortcutData.id

    return (
      <React.Suspense fallback={null}>
        <ShortcutComponent
          className="cursor-default"
          shortcutData={this.__shortcutData}
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

export function $createShortcutNode(shortcutData: ShortcutData): ShortcutNode {
  const shortcutNode = new ShortcutNode(shortcutData)
  return $applyNodeReplacement(shortcutNode)
}

export function $isShortcutNode(node: LexicalNode | null | undefined): node is ShortcutNode {
  return node instanceof ShortcutNode
}
