import { db } from "@follow/database/db"
import { aiChatMessagesTable, aiChatTable } from "@follow/database/schemas/index"
import { asc, eq, inArray, sql } from "drizzle-orm"
import type { SerializedEditorState } from "lexical"

import type { BizUIMessage } from "../__internal__/types"
import type { MessageContent } from "../utils/lexical-markdown"

class AIPersistServiceStatic {
  async loadMessages(chatId: string) {
    return db.query.aiChatMessagesTable.findMany({
      where: eq(aiChatMessagesTable.chatId, chatId),
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
  async loadUIMessages(chatId: string): Promise<BizUIMessage[]> {
    const dbMessages = await this.loadMessages(chatId)
    return dbMessages.map((msg) => this.convertToUIMessage(msg))
  }

  /**
   * Store a rich text message from user input
   */
  async insertRichTextMessage(chatId: string, messageId: string, content: MessageContent) {
    let richTextSchema: SerializedEditorState | undefined

    if (content.format === "richtext") {
      richTextSchema = content.content as SerializedEditorState
    }

    await db.insert(aiChatMessagesTable).values({
      id: messageId,
      chatId,
      role: "user",

      richTextSchema,
      createdAt: new Date(),
      status: "completed",
    })
  }

  async insertMessages(chatId: string, messages: BizUIMessage[]) {
    if (messages.length === 0) {
      return
    }

    await db
      .insert(aiChatMessagesTable)
      .values(
        messages.map((message) => {
          // Store parts as-is since they're stored as JSON and the UI can handle them
          const convertedParts = message.parts as any[]

          return {
            id: message.id,
            chatId,
            role: message.role,
            contentFormat: "plaintext" as const,

            richTextSchema: undefined,
            createdAt: new Date(),
            status: "completed" as const,
            finishedAt: message.metadata?.finishTime
              ? new Date(message.metadata.finishTime)
              : undefined,
            messageParts: convertedParts,
            metadata: message.metadata,
          } as typeof aiChatMessagesTable.$inferInsert
        }),
      )
      .onConflictDoUpdate({
        target: [aiChatMessagesTable.id],
        set: {
          messageParts: sql`excluded.messageParts`,
          metadata: sql`excluded.metadata`,
          finishedAt: sql`excluded.finishedAt`,
          createdAt: sql`excluded.createdAt`,
          status: sql`excluded.status`,
          richTextSchema: sql`excluded.richTextSchema`,
        },
      })
  }

  async replaceAllMessages(chatId: string, messages: BizUIMessage[]) {
    await db.delete(aiChatMessagesTable).where(eq(aiChatMessagesTable.chatId, chatId))
    await this.insertMessages(chatId, messages)
  }

  async createSession(chatId: string, title?: string) {
    const now = new Date()
    await db.insert(aiChatTable).values({
      chatId,
      title,
      createdAt: now,
      updatedAt: now,
    })
  }

  async getChatSession(chatId: string) {
    return db.query.aiChatTable.findFirst({
      where: eq(aiChatTable.chatId, chatId),
      columns: {
        chatId: true,
        title: true,
        createdAt: true,
      },
    })
  }

  async getChatSessions(limit = 20) {
    const chats = await db.query.aiChatTable.findMany({
      columns: {
        chatId: true,
        title: true,
        createdAt: true,
      },
      orderBy: (t, { desc }) => desc(t.createdAt),
      limit,
    })

    const result = await Promise.all(
      chats.map(async (chat) => {
        const messageCountResult = await db.values<[number]>(
          sql`SELECT COUNT(*) FROM ${aiChatMessagesTable} WHERE ${aiChatMessagesTable.chatId} = ${chat.chatId}`,
        )

        const messageCount = messageCountResult[0]?.[0] || 0

        return {
          chatId: chat.chatId,
          title: chat.title,
          createdAt: chat.createdAt,
          messageCount,
        }
      }),
    )

    return result.filter((chat) => chat.messageCount > 0)
  }

  async deleteSession(chatId: string) {
    await db.delete(aiChatMessagesTable).where(eq(aiChatMessagesTable.chatId, chatId))
    await db.delete(aiChatTable).where(eq(aiChatTable.chatId, chatId))
  }

  async updateSessionTitle(chatId: string, title: string) {
    await db
      .update(aiChatTable)
      .set({
        title,
        updatedAt: new Date(Date.now()),
      })
      .where(eq(aiChatTable.chatId, chatId))
  }

  async cleanupEmptySessions() {
    const emptySessions = await db.values<[string]>(
      sql`
        SELECT ${aiChatTable.chatId}
        FROM ${aiChatTable}
        LEFT JOIN ${aiChatMessagesTable} ON ${aiChatTable.chatId} = ${aiChatMessagesTable.chatId}
        GROUP BY ${aiChatTable.chatId}
        HAVING COUNT(${aiChatMessagesTable.id}) = 0
      `,
    )

    // Delete empty sessions
    if (emptySessions.length > 0) {
      const chatIdsToDelete = emptySessions.map((row) => row[0])
      await db.delete(aiChatTable).where(inArray(aiChatTable.chatId, chatIdsToDelete))
    }
  }
}
export const AIPersistService = new AIPersistServiceStatic()
