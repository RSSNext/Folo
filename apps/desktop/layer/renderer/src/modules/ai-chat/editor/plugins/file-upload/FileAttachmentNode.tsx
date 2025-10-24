/* eslint-disable react-refresh/only-export-components */
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

import { useAIMessageOptionalId } from "~/modules/ai-chat/components/message/AIMessageIdContext"
import { useChatBlockSelector, useMessageByIdSelector } from "~/modules/ai-chat/store/hooks"
import type { FileAttachment } from "~/modules/ai-chat/store/types"
import { findFileAttachmentBlock, isDataBlockPart } from "~/modules/ai-chat/utils/extractor"

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

function FileAttachmentPill({ attachment }: { attachment: FileAttachment }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded border border-border bg-fill px-2 py-1 text-xs"
      style={{
        backgroundColor: "var(--fill)",
        color: "var(--text)",
        border: "1px solid var(--border)",
      }}
    >
      <i className="i-mgc-attachment-cute-re" />
      <span className="max-w-32 truncate" title={attachment.name}>
        {attachment.name}
      </span>
      {attachment.uploadStatus === "uploading" && (
        <i className="i-mgc-loading-3-cute-re animate-spin text-accent" />
      )}
      {attachment.uploadStatus === "processing" && (
        <i className="i-mgc-loading-3-cute-re animate-spin text-accent" />
      )}
      {attachment.uploadStatus === "error" && <i className="i-mgc-close-cute-re text-red" />}
      {attachment.uploadStatus === "completed" && <i className="i-mgc-check-cute-re text-green" />}
    </span>
  )
}

function MissingFilePill() {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-border bg-fill px-2 py-1 text-xs text-gray">
      <i className="i-mgc-attachment-cute-re" />
      <span className="max-w-32 truncate">File not found</span>
    </span>
  )
}

function BlockBasedAttachment({ attachmentId }: { attachmentId: string }) {
  const block = useChatBlockSelector((state) =>
    state.blocks.find(
      (block) => block.type === "fileAttachment" && block.attachment.id === attachmentId,
    ),
  )

  if (!block || block.type !== "fileAttachment") {
    return <MissingFilePill />
  }

  return <FileAttachmentPill attachment={block.attachment} />
}

function MessageBasedAttachment({
  attachmentId,
  messageId,
}: {
  attachmentId: string
  messageId: string
}) {
  const attachment = useMessageByIdSelector(messageId, (message) => {
    for (const part of message.parts) {
      if (!isDataBlockPart(part)) continue
      const block = findFileAttachmentBlock(part, attachmentId)
      if (block) return block.attachment
    }
  })

  if (attachment) return <FileAttachmentPill attachment={attachment} />
  // Fallback to block-based when message-based lookup fails
  return <BlockBasedAttachment attachmentId={attachmentId} />
}

function FileAttachmentComponent({ node }: FileAttachmentComponentProps) {
  const attachmentId = node.getAttachmentId()

  const messageId = useAIMessageOptionalId()

  if (messageId) {
    return <MessageBasedAttachment attachmentId={attachmentId} messageId={messageId} />
  }
  return <BlockBasedAttachment attachmentId={attachmentId} />
}

export function $createFileAttachmentNode(attachmentId: string): FileAttachmentNode {
  return new FileAttachmentNode(attachmentId)
}

export function $isFileAttachmentNode(
  node: LexicalNode | null | undefined,
): node is FileAttachmentNode {
  return node instanceof FileAttachmentNode
}
