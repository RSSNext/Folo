import type { AsyncDb } from "@follow/database/db"
import { db } from "@follow/database/db"
import { aiChatMessagesTable, aiChatTable } from "@follow/database/schemas/index"
import { asc, count, eq, inArray, sql } from "drizzle-orm"
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
          messageParts: sql`excluded.message_parts`,
          metadata: sql`excluded.metadata`,
          finishedAt: sql`excluded.finished_at`,
          createdAt: sql`excluded.created_at`,
          status: sql`excluded.status`,
          richTextSchema: sql`excluded.rich_text_schema`,
        },
      })
  }

  async replaceAllMessages(chatId: string, messages: BizUIMessage[]) {
    await db.delete(aiChatMessagesTable).where(eq(aiChatMessagesTable.chatId, chatId))
    await this.insertMessages(chatId, messages)
  }

  /**
   * Upsert specific messages (insert new, update existing)
   * Ensures the chat session exists before inserting messages
   */
  async upsertMessages(chatId: string, messages: BizUIMessage[]) {
    if (messages.length === 0) {
      return
    }

    // Ensure the chat session exists first to avoid foreign key constraint failure
    await this.ensureSession(chatId)

    await db
      .insert(aiChatMessagesTable)
      .values(
        messages.map((message) => {
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
          messageParts: sql`excluded.message_parts`,
          metadata: sql`excluded.metadata`,
          finishedAt: sql`excluded.finished_at`,
          status: sql`excluded.status`,
          richTextSchema: sql`excluded.rich_text_schema`,
        },
      })
  }

  /**
   * Delete specific messages by ID
   */
  async deleteMessages(chatId: string, messageIds: string[]) {
    if (messageIds.length === 0) {
      return
    }

    await db
      .delete(aiChatMessagesTable)
      .where(eq(aiChatMessagesTable.chatId, chatId) && inArray(aiChatMessagesTable.id, messageIds))
  }

  /**
   * Ensure session exists (idempotent operation)
   */
  async ensureSession(chatId: string, title?: string) {
    const existing = await this.getChatSession(chatId)

    if (!existing) {
      await this.createSession(chatId, title)
      return { created: true, session: { chatId, title, createdAt: new Date() } }
    }
    return { created: false, session: existing }
  }

  /**
   * Batch multiple persistence operations atomically
   */
  async batchUpdate(
    operations: Array<{
      type: "session_create" | "session_update" | "messages_upsert" | "messages_delete"
      payload: any
    }>,
  ) {
    return db.transaction(async (tx) => {
      for (const operation of operations) {
        switch (operation.type) {
          case "session_create": {
            await tx
              .insert(aiChatTable)
              .values({
                chatId: operation.payload.chatId,
                title: operation.payload.title,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .onConflictDoNothing()
            break
          }

          case "session_update": {
            await tx
              .update(aiChatTable)
              .set({
                title: operation.payload.title,
                updatedAt: new Date(),
              })
              .where(eq(aiChatTable.chatId, operation.payload.chatId))
            break
          }

          case "messages_upsert": {
            if (operation.payload.messages.length > 0) {
              await tx
                .insert(aiChatMessagesTable)
                .values(operation.payload.messages)
                .onConflictDoUpdate({
                  target: [aiChatMessagesTable.id],
                  set: {
                    messageParts: sql`excluded.message_parts`,
                    metadata: sql`excluded.metadata`,
                    finishedAt: sql`excluded.finished_at`,
                    status: sql`excluded.status`,
                    richTextSchema: sql`excluded.rich_text_schema`,
                  },
                })
            }
            break
          }

          case "messages_delete": {
            if (operation.payload.messageIds.length > 0) {
              await tx
                .delete(aiChatMessagesTable)
                .where(
                  eq(aiChatMessagesTable.chatId, operation.payload.chatId) &&
                    inArray(aiChatMessagesTable.id, operation.payload.messageIds),
                )
            }
            break
          }
        }
      }
    })
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
    const result = await db.query.aiChatTable.findFirst({
      where: eq(aiChatTable.chatId, chatId),
      columns: {
        chatId: true,
        title: true,
        createdAt: true,
      },
    })

    // Explicitly check if the result is valid
    if (!result || !result.chatId) {
      return null
    }

    return result
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

    if (chats.length === 0) {
      return []
    }

    const chatIds = chats.map((chat) => chat.chatId)
    const messageCounts = await (db as AsyncDb)
      .select({
        chatId: aiChatMessagesTable.chatId,
        messageCount: count(aiChatMessagesTable.id),
      })
      .from(aiChatMessagesTable)
      .where(inArray(aiChatMessagesTable.chatId, chatIds))
      .groupBy(aiChatMessagesTable.chatId)

    const messageCountMap = new Map(messageCounts.map((item) => [item.chatId, item.messageCount]))

    return chats
      .map((chat) => ({
        chatId: chat.chatId,
        title: chat.title,
        createdAt: chat.createdAt,
        messageCount: messageCountMap.get(chat.chatId) || 0,
      }))
      .filter((chat) => chat.messageCount > 0)
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
