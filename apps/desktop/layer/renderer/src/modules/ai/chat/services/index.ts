import type { AsyncDb } from "@follow/database/db"
import { db } from "@follow/database/db"
import { aiChatMessagesTable, aiChatTable } from "@follow/database/schemas/index"
import { asc, count, eq, inArray, sql } from "drizzle-orm"

import type { BizUIMessage } from "../__internal__/types"

class AIPersistServiceStatic {
  // Cache for session existence to avoid repeated queries
  private sessionExistsCache = new Map<string, boolean>()

  // Clear cache when session is created or deleted
  private markSessionExists(chatId: string, exists: boolean) {
    this.sessionExistsCache.set(chatId, exists)
  }

  private getSessionExistsFromCache(chatId: string): boolean | undefined {
    return this.sessionExistsCache.get(chatId)
  }

  private clearSessionCache(chatId?: string) {
    if (chatId) {
      this.sessionExistsCache.delete(chatId)
    } else {
      this.sessionExistsCache.clear()
    }
  }

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
   * Load session and messages in a single optimized call
   * Returns both session details and messages to avoid redundant queries
   */
  async loadSessionWithMessages(chatId: string): Promise<{
    session: { chatId: string; title?: string; createdAt: Date } | null
    messages: BizUIMessage[]
  }> {
    // Load both session and messages in parallel
    const [sessionRaw, messages] = await Promise.all([
      this.getChatSession(chatId),
      this.loadUIMessages(chatId),
    ])

    // Convert null title to undefined for type compatibility
    const session = sessionRaw
      ? {
          ...sessionRaw,
          title: sessionRaw.title || undefined,
        }
      : null

    return { session, messages }
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
  async ensureSession(chatId: string, title?: string): Promise<void> {
    // Check cache first to avoid database query
    const cachedExists = this.getSessionExistsFromCache(chatId)

    if (cachedExists === true) {
      return
    }

    // Only query database if not in cache or cache shows it doesn't exist
    if (cachedExists === undefined) {
      const existing = await this.getChatSession(chatId)

      if (existing) {
        this.markSessionExists(chatId, true)
        return
      }

      // Mark as not existing before creating
      this.markSessionExists(chatId, false)
    }

    // Create new session
    await this.createSession(chatId, title)
    this.markSessionExists(chatId, true)
  }

  async createSession(chatId: string, title?: string) {
    const now = new Date()
    await db.insert(aiChatTable).values({
      chatId,
      title,
      createdAt: now,
      updatedAt: now,
    })
    // Mark session as existing in cache
    this.markSessionExists(chatId, true)
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
      // Mark as not existing in cache
      this.markSessionExists(chatId, false)
      return null
    }

    // Mark as existing in cache
    this.markSessionExists(chatId, true)
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
    // Clear session from cache
    this.clearSessionCache(chatId)
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

      // Clear deleted sessions from cache
      chatIdsToDelete.forEach((chatId) => this.clearSessionCache(chatId))
    }
  }
}
export const AIPersistService = new AIPersistServiceStatic()
