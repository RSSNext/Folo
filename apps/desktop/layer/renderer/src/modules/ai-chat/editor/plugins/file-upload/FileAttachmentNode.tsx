import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical"
import { DecoratorNode } from "lexical"
import * as React from "react"
import { useShallow } from "zustand/shallow"

import { useAIChatStore } from "~/modules/ai-chat/store/AIChatContext"

export type SerializedFileAttachmentNode = Spread<
  {
    attachmentId: string
  },
  SerializedLexicalNode
>

function convertFileAttachmentElement(domNode: Node): null | DOMConversionOutput {
  const element = domNode as HTMLElement
  const { attachmentId } = element.dataset
  if (attachmentId) {
    const node = $createFileAttachmentNode(attachmentId)
    return { node }
  }
  return null
}

export class FileAttachmentNode extends DecoratorNode<React.ReactElement> {
  __attachmentId: string

  static override getType(): string {
    return "file-attachment"
  }

  static override clone(node: FileAttachmentNode): FileAttachmentNode {
    return new FileAttachmentNode(node.__attachmentId, node.__key)
  }

  static override importJSON(serializedNode: SerializedFileAttachmentNode): FileAttachmentNode {
    const { attachmentId } = serializedNode
    const node = $createFileAttachmentNode(attachmentId)
    return node
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      span: () => ({
        conversion: convertFileAttachmentElement,
        priority: 1,
      }),
    }
  }

  constructor(attachmentId: string, key?: NodeKey) {
    super(key)
    this.__attachmentId = attachmentId
  }

  override exportJSON(): SerializedFileAttachmentNode {
    return {
      attachmentId: this.__attachmentId,
      type: "file-attachment",
      version: 1,
    }
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement("span")
    element.dataset.attachmentId = this.__attachmentId
    element.textContent = `[File: ${this.__attachmentId}]`
    return { element }
  }

  override createDOM(): HTMLElement {
    const span = document.createElement("span")
    span.style.display = "inline-block"
    span.dataset.attachmentId = this.__attachmentId
    return span
  }

  override updateDOM(): false {
    return false
  }

  getAttachmentId(): string {
    return this.__attachmentId
  }

  setAttachmentId(attachmentId: string): void {
    const writable = this.getWritable()
    writable.__attachmentId = attachmentId
  }

  override decorate(): React.ReactElement {
    return <FileAttachmentComponent node={this} />
  }

  override isInline(): boolean {
    return true
  }
}

interface FileAttachmentComponentProps {
  node: FileAttachmentNode
}

function FileAttachmentComponent({ node }: FileAttachmentComponentProps) {
  const attachmentId = node.getAttachmentId()

  const fileAttachment = useAIChatStore()(
    useShallow((state) => {
      const block = state.blocks.find(
        (block) => block.type === "fileAttachment" && block.attachment.id === attachmentId,
      )
      return block?.type === "fileAttachment" ? block.attachment : null
    }),
  )

  if (!fileAttachment) {
    return (
      <span className="bg-fill border-border text-gray inline-flex items-center gap-1 rounded border px-2 py-1 text-xs">
        <i className="i-mgc-attachment-cute-re" />
        <span className="max-w-32 truncate">File not found</span>
      </span>
    )
  }

  return (
    <span
      className="bg-fill border-border inline-flex items-center gap-1 rounded border px-2 py-1 text-xs"
      style={{
        backgroundColor: "var(--fill)",
        color: "var(--text)",
        border: "1px solid var(--border)",
      }}
    >
      <i className="i-mgc-attachment-cute-re" />
      <span className="max-w-32 truncate" title={fileAttachment.name}>
        {fileAttachment.name}
      </span>
      {fileAttachment.uploadStatus === "uploading" && (
        <i className="i-mgc-loading-3-cute-re text-accent animate-spin" />
      )}
      {fileAttachment.uploadStatus === "processing" && (
        <i className="i-mgc-loading-3-cute-re text-accent animate-spin" />
      )}
      {fileAttachment.uploadStatus === "error" && <i className="i-mgc-close-cute-re text-red" />}
      {fileAttachment.uploadStatus === "completed" && (
        <i className="i-mgc-check-cute-re text-green" />
      )}
    </span>
  )
}

export function $createFileAttachmentNode(attachmentId: string): FileAttachmentNode {
  return new FileAttachmentNode(attachmentId)
}

export function $isFileAttachmentNode(
  node: LexicalNode | null | undefined,
): node is FileAttachmentNode {
  return node instanceof FileAttachmentNode
}
