import { db } from "@follow/database/db"
import { aiChatMessagesTable, aiChatTable } from "@follow/database/schemas/index"
import { asc, eq, inArray, sql } from "drizzle-orm"
import type { SerializedEditorState } from "lexical"

import type { BizUIMessage } from "../__internal__/types"
import type { MessageContent } from "../utils/lexical-markdown"

class AIPersistServiceStatic {
  async loadMessages(roomId: string) {
    return db.query.aiChatMessagesTable.findMany({
      where: eq(aiChatMessagesTable.roomId, roomId),
      orderBy: [asc(aiChatMessagesTable.createdAt)],
    })
  }

  /**
   * Convert enhanced database message to BizUIMessage format for compatibility
   */
  private convertToUIMessage(dbMessage: any): BizUIMessage {
    // Reconstruct UIMessage from database fields
    const uiMessage: BizUIMessage = {
      id: dbMessage.id,
      role: dbMessage.role,
      parts: [], // AI SDK v5 uses parts array
    }

    // Add parts based on content format and data
    if (dbMessage.messageParts && dbMessage.messageParts.length > 0) {
      // For assistant messages with complex parts (tools, reasoning, etc)
      uiMessage.parts = dbMessage.messageParts
    } else {
      // For simple text messages, create a text part
      uiMessage.parts = [
        {
          type: "text",
          text: dbMessage.content,
        },
      ]
    }

    return uiMessage
  }

  /**
   * Enhanced message loading that converts to UIMessage format
   */
  async loadUIMessages(roomId: string): Promise<BizUIMessage[]> {
    const dbMessages = await this.loadMessages(roomId)
    return dbMessages.map((msg) => this.convertToUIMessage(msg))
  }

  /**
   * Store a rich text message from user input
   */
  async insertRichTextMessage(
    roomId: string,
    messageId: string,
    content: MessageContent,
    markdownContent?: string,
  ) {
    let finalMarkdown = markdownContent
    let richTextSchema: SerializedEditorState | undefined

    if (content.format === "richtext") {
      richTextSchema = content.content as SerializedEditorState
      // Convert to markdown if not provided
      if (!finalMarkdown) {
        // This would need a Lexical editor instance to convert
        // For now, we'll extract text content from the schema
        finalMarkdown = this.extractTextFromSchema(richTextSchema)
      }
    } else {
      finalMarkdown = content.content as string
    }

    await db.insert(aiChatMessagesTable).values({
      id: messageId,
      roomId,
      role: "user",
      contentFormat: content.format,
      content: finalMarkdown,
      richTextSchema,
      createdAt: new Date(),
      status: "completed",
    })
  }

  /**
   * Extract plain text from Lexical schema for fallback
   */
  private extractTextFromSchema(schema: SerializedEditorState): string {
    try {
      const textContent: string[] = []

      const extractText = (node: any) => {
        if (node.type === "text") {
          textContent.push(node.text || "")
        }
        if (node.children) {
          node.children.forEach(extractText)
        }
      }

      schema.root?.children?.forEach(extractText)
      return textContent.join("")
    } catch (error) {
      console.error("Failed to extract text from Lexical schema:", error)
      return ""
    }
  }

  async insertMessages(roomId: string, messages: BizUIMessage[]) {
    if (messages.length === 0) {
      return
    }

    await db.insert(aiChatMessagesTable).values(
      messages.map((message) => {
        // Extract text content from parts array for fallback content
        const textContent = message.parts
          .filter((part) => part.type === "text")
          .map((part) => (part as any).text)
          .join("")

        // Store parts as-is since they're stored as JSON and the UI can handle them
        const convertedParts = message.parts as any[]

        return {
          id: message.id,
          roomId,
          role: message.role,
          contentFormat: "plaintext" as const,
          content: textContent || "",
          richTextSchema: undefined,
          createdAt: new Date(),
          annotations: [], // AI SDK v5 messages don't have annotations
          status: "completed" as const,
          finishedAt: message.metadata?.finishTime
            ? new Date(message.metadata.finishTime)
            : undefined,
          messageParts: convertedParts,
        }
      }),
    )
  }

  async replaceAllMessages(roomId: string, messages: BizUIMessage[]) {
    await db.delete(aiChatMessagesTable).where(eq(aiChatMessagesTable.roomId, roomId))
    await this.insertMessages(roomId, messages)
  }

  async createSession(roomId: string, title?: string) {
    const now = new Date()
    await db.insert(aiChatTable).values({
      roomId,
      title,
      createdAt: now,
      updatedAt: now,
    })
  }

  async getChatSessions(limit = 20) {
    const chats = await db.query.aiChatTable.findMany({
      columns: {
        roomId: true,
        title: true,
        createdAt: true,
      },
      orderBy: (t, { desc }) => desc(t.createdAt),
      limit,
    })

    const result = await Promise.all(
      chats.map(async (chat) => {
        // Use raw SQL count query
        const messageCountResult = await db.values<[number]>(
          sql`SELECT COUNT(*) FROM ${aiChatMessagesTable} WHERE ${aiChatMessagesTable.roomId} = ${chat.roomId}`,
        )

        const messageCount = messageCountResult[0]?.[0] || 0

        return {
          roomId: chat.roomId,
          title: chat.title,
          createdAt: chat.createdAt,
          messageCount,
        }
      }),
    )

    // Filter out chats with 0 messages
    return result.filter((chat) => chat.messageCount > 0)
  }

  async deleteSession(roomId: string) {
    await db.delete(aiChatMessagesTable).where(eq(aiChatMessagesTable.roomId, roomId))
    await db.delete(aiChatTable).where(eq(aiChatTable.roomId, roomId))
  }

  async updateSessionTitle(roomId: string, title: string) {
    await db
      .update(aiChatTable)
      .set({
        title,
        updatedAt: new Date(Date.now()),
      })
      .where(eq(aiChatTable.roomId, roomId))
  }

  async cleanupEmptySessions() {
    // Use raw SQL to find empty sessions
    const emptySessions = await db.values<[string]>(
      sql`
        SELECT ${aiChatTable.roomId}
        FROM ${aiChatTable}
        LEFT JOIN ${aiChatMessagesTable} ON ${aiChatTable.roomId} = ${aiChatMessagesTable.roomId}
        GROUP BY ${aiChatTable.roomId}
        HAVING COUNT(${aiChatMessagesTable.id}) = 0
      `,
    )

    // Delete empty sessions
    if (emptySessions.length > 0) {
      const roomIdsToDelete = emptySessions.map((row) => row[0])
      await db.delete(aiChatTable).where(inArray(aiChatTable.roomId, roomIdsToDelete))
    }
  }
}
export const AIPersistService = new AIPersistServiceStatic()
