import { db } from "@follow/database/db"
import type { AiChatMessagesModel } from "@follow/database/schemas/index"
import { aiChatMessagesTable, aiChatTable } from "@follow/database/schemas/index"
import { asc, eq, inArray, sql } from "drizzle-orm"

import { getI18n } from "~/i18n"
import { followClient } from "~/lib/api-client"

import { AI_CHAT_SPECIAL_ID_PREFIX } from "../constants"
import type { BizUIMessage, BizUIMessagePart } from "../store/types"
import { isDataBlockPart, isFileAttachmentBlock } from "../utils/extractor"

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

  async loadMessages(chatId: string): Promise<AiChatMessagesModel[]> {
    return db.query.aiChatMessagesTable.findMany({
      where: eq(aiChatMessagesTable.chatId, chatId),
      orderBy: [asc(aiChatMessagesTable.createdAt)],
    })
  }

  async hasPersistedMessages(chatId: string): Promise<boolean> {
    const existingMessage = await db.query.aiChatMessagesTable.findFirst({
      where: eq(aiChatMessagesTable.chatId, chatId),
      columns: {
        id: true,
      },
    })

    return Boolean(existingMessage?.id === chatId)
  }

  /**
   * Convert enhanced database message to BizUIMessage format for compatibility
   */
  private convertToUIMessage(dbMessage: AiChatMessagesModel): BizUIMessage {
    const uiMessage: BizUIMessage = {
      id: dbMessage.id,
      role: dbMessage.role,
      createdAt: dbMessage.createdAt,
      parts: [],
    }

    if (dbMessage.messageParts && dbMessage.messageParts.length > 0) {
      uiMessage.parts = dbMessage.messageParts as any[] as BizUIMessagePart[]
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
    session: {
      chatId: string
      title?: string
      createdAt: Date
      updatedAt: Date
      isLocal: boolean
      syncStatus: "local" | "synced"
    } | null
    messages: BizUIMessage[]
  }> {
    // Load both session and messages in parallel
    const [sessionRaw, messages] = await Promise.all([
      this.getChatSession(chatId),
      this.loadUIMessages(chatId),
    ])

    // Convert null title to undefined for type compatibility
    if (!sessionRaw) {
      return { session: null, messages }
    }

    const resolvedTitle = this.resolveSessionTitle(sessionRaw.chatId, sessionRaw.title, {
      createdAt: sessionRaw.createdAt,
      updatedAt: sessionRaw.updatedAt,
    })

    if (resolvedTitle && sessionRaw.title !== resolvedTitle) {
      await this.updateSessionTitle(sessionRaw.chatId, resolvedTitle)
    }

    const isLocal = Boolean(sessionRaw.isLocal)
    const syncStatus: "local" | "synced" = isLocal ? "local" : "synced"

    const session = {
      ...sessionRaw,
      title: resolvedTitle ?? undefined,
      isLocal,
      syncStatus,
    }

    return { session, messages }
  }

  async replaceAllMessages(chatId: string, messages: BizUIMessage[]) {
    await db.delete(aiChatMessagesTable).where(eq(aiChatMessagesTable.chatId, chatId))
    await this.upsertMessages(chatId, messages)
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

    const results = messages.reduce<(typeof aiChatMessagesTable.$inferInsert)[]>((acc, message) => {
      if (message.parts.length === 0) return acc

      const { createdAt } = message
      const cleanParts = [] as typeof message.parts

      for (const part of message.parts) {
        // Skip streaming messages
        if ("state" in part && part.state === "streaming") {
          return acc
        }
        if (isDataBlockPart(part)) {
          const nextPart = structuredClone(part)
          for (const block of nextPart.data) {
            if (isFileAttachmentBlock(block)) {
              Reflect.deleteProperty(block.attachment, "dataUrl")
            }
          }

          cleanParts.push(nextPart)
        } else {
          cleanParts.push(part)
        }
      }

      acc.push({
        id: message.id,
        chatId,
        role: message.role,
        createdAt,
        status: "completed" as const,
        finishedAt: message.metadata?.finishTime
          ? new Date(message.metadata.finishTime)
          : undefined,
        messageParts: cleanParts,
        metadata: message.metadata,
      })

      return acc
    }, [])
    await db
      .insert(aiChatMessagesTable)
      .values(results)
      .onConflictDoUpdate({
        target: [aiChatMessagesTable.id],
        set: {
          messageParts: sql`excluded.message_parts`,
          metadata: sql`excluded.metadata`,
          finishedAt: sql`excluded.finished_at`,
          status: sql`excluded.status`,
          createdAt: sql`excluded.created_at`,
        },
      })

    const date = results.reduce<Date | null>((latest, msg) => {
      const date = msg.createdAt ? new Date(msg.createdAt) : null
      if (date === null) {
        return latest
      }
      if (!latest || date > latest) {
        return date
      }
      return latest
    }, null)
    if (date) {
      // Update session time after successfully saving messages
      await AIPersistService.updateSessionTime(chatId, date)
    }
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

  private resolveSessionTitle(
    chatId: string,
    title?: string | null,
    timestamps?: { createdAt?: Date; updatedAt?: Date },
  ): string | undefined {
    const trimmed = title?.trim()
    if (trimmed) {
      return trimmed
    }

    return this.getDefaultSessionTitle(chatId, timestamps)
  }

  private getDefaultSessionTitle(
    chatId: string,
    timestamps?: { createdAt?: Date; updatedAt?: Date },
  ): string | undefined {
    const i18n = getI18n()
    const prefix = AI_CHAT_SPECIAL_ID_PREFIX.TIMELINE_SUMMARY

    if (!chatId.startsWith(prefix)) {
      const referenceDate = timestamps?.updatedAt ?? timestamps?.createdAt ?? new Date()
      const formattedDateTime = this.formatDateTime(referenceDate, i18n.language)

      return `${formattedDateTime} chat`
    }

    const datePart = chatId.slice(prefix.length)
    const [yearStr, monthStr, dayStr] = datePart.split("-")

    const now = new Date()
    const year = Number.parseInt(yearStr ?? "", 10)
    const month = Number.parseInt(monthStr ?? "", 10)
    const day = Number.parseInt(dayStr ?? "", 10)

    let targetDate = new Date(now)
    if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
      const parsedDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes())
      if (!Number.isNaN(parsedDate.getTime())) {
        targetDate = parsedDate
      }
    }

    const formattedDateTime = this.formatDateTime(targetDate, i18n.language)

    return `${formattedDateTime} timeline summary`
  }

  private formatDateTime(date: Date, locale?: string): string {
    try {
      const resolvedLocale = locale && locale.length > 0 ? locale : undefined
      const timeFormatter = new Intl.DateTimeFormat(resolvedLocale, {
        hour: "numeric",
      })
      const dateFormatter = new Intl.DateTimeFormat(resolvedLocale, {
        dateStyle: "medium",
      })

      const formattedTime = timeFormatter.format(date)
      const formattedDate = dateFormatter.format(date)

      return `${formattedTime} ${formattedDate}`
    } catch {
      const pad = (value: number) => value.toString().padStart(2, "0")
      const year = date.getFullYear()
      const month = pad(date.getMonth() + 1)
      const day = pad(date.getDate())
      const hours = pad(date.getHours())
      return `${hours} ${year}-${month}-${day}`
    }
  }

  /**
   * Ensure session exists (idempotent operation)
   */
  async ensureSession(
    chatId: string,
    options: { title?: string; createdAt?: Date; updatedAt?: Date; isLocal?: boolean } = {},
  ): Promise<void> {
    const cachedExists = this.getSessionExistsFromCache(chatId)
    const shouldCheckDb =
      cachedExists !== true || options.title !== undefined || typeof options.isLocal === "boolean"

    if (!shouldCheckDb) {
      return
    }

    const existing = await this.getChatSession(chatId)

    if (existing) {
      this.markSessionExists(chatId, true)

      const updates: Partial<typeof aiChatTable.$inferInsert> = {}
      let shouldUpdate = false

      const hasExistingTitle = existing.title?.trim().length
      if (!hasExistingTitle) {
        const resolvedTitle = this.resolveSessionTitle(chatId, options.title ?? existing.title, {
          createdAt: existing.createdAt,
          updatedAt: existing.updatedAt,
        })
        if (resolvedTitle && resolvedTitle !== existing.title) {
          updates.title = resolvedTitle
          shouldUpdate = true
        }
      }

      if (typeof options.isLocal === "boolean" && existing.isLocal !== options.isLocal) {
        updates.isLocal = options.isLocal
        shouldUpdate = true
      }

      if (shouldUpdate) {
        updates.updatedAt = new Date()
        await db.update(aiChatTable).set(updates).where(eq(aiChatTable.chatId, chatId))
      }
      return
    }

    // Create new session
    await this.createSession(chatId, options)
    this.markSessionExists(chatId, true)
  }

  async createSession(
    chatId: string,
    options: { title?: string; createdAt?: Date; updatedAt?: Date; isLocal?: boolean } = {},
  ) {
    const now = new Date()
    await db.insert(aiChatTable).values({
      chatId,
      title: this.resolveSessionTitle(chatId, options.title, { createdAt: now, updatedAt: now }),
      createdAt: options.createdAt ?? now,
      updatedAt: options.updatedAt ?? now,
      isLocal: options.isLocal ?? true,
    })
    // Mark session as existing in cache
    this.markSessionExists(chatId, true)
  }

  async findTimelineSummarySession(criteria: {
    view: number
    feedId: string
    timelineId?: string | null
    unreadOnly: boolean
  }) {
    const timelineSegment = criteria.timelineId ?? "all"
    const unreadSegment = criteria.unreadOnly ? "unread" : "all"
    const prefix = `${AI_CHAT_SPECIAL_ID_PREFIX.TIMELINE_SUMMARY}${criteria.view}:${criteria.feedId}:${timelineSegment}:${unreadSegment}:`
    return db.query.aiChatTable
      .findFirst({
        where: (table) => sql`${table.chatId} LIKE ${`${prefix}%`}`,
        orderBy: (table, { desc }) => desc(table.updatedAt),
        columns: {
          chatId: true,
          title: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      .then((session) => session ?? null)
  }

  async getChatSession(chatId: string) {
    const result = await db.query.aiChatTable.findFirst({
      where: eq(aiChatTable.chatId, chatId),
      columns: {
        chatId: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        isLocal: true,
      },
    })
    return result?.chatId ? result : null
  }

  async getChatSessions(limit = 20) {
    const chats = await db.query.aiChatTable.findMany({
      columns: {
        chatId: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        isLocal: true,
      },
      orderBy: (t, { desc }) => desc(t.updatedAt),
      limit,
    })

    if (chats.length === 0) {
      return []
    }

    const normalizedChats = await Promise.all(
      chats.map(async (chat) => {
        const resolvedTitle = this.resolveSessionTitle(chat.chatId, chat.title, {
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
        })

        if (resolvedTitle && chat.title !== resolvedTitle) {
          await this.updateSessionTitle(chat.chatId, resolvedTitle)
        }

        return {
          ...chat,
          title: resolvedTitle ?? chat.title ?? undefined,
        }
      }),
    )

    return normalizedChats.map((chat) => {
      const isLocal = Boolean(chat.isLocal)
      const syncStatus: "local" | "synced" = isLocal ? "local" : "synced"

      return {
        chatId: chat.chatId,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        isLocal,
        syncStatus,
      }
    })
  }

  async deleteSession(chatId: string) {
    await db.delete(aiChatMessagesTable).where(eq(aiChatMessagesTable.chatId, chatId))
    await db.delete(aiChatTable).where(eq(aiChatTable.chatId, chatId))
    // Clear session from cache
    this.clearSessionCache(chatId)
    await followClient.api.aiChatSessions.delete({ chatId }).catch((error) => {
      console.error("Failed to delete remote chat session:", error)
    })
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

  async updateSessionTime(chatId: string, date: Date = new Date()) {
    await db
      .update(aiChatTable)
      .set({
        updatedAt: date,
      })
      .where(eq(aiChatTable.chatId, chatId))
  }

  async markSessionSynced(chatId: string) {
    await this.ensureSession(chatId, { isLocal: false })
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
      for (const chatId of chatIdsToDelete) {
        await followClient.api.aiChatSessions.delete({ chatId }).catch((error) => {
          console.error("Failed to delete remote chat sessions:", error)
        })
      }
    }
  }
}
export const AIPersistService = new AIPersistServiceStatic()
