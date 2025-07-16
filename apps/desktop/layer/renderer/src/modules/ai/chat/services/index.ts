import { db } from "@follow/database/db"
import { aiChatMessagesTable, aiChatTable } from "@follow/database/schemas/index"
import { asc, eq, inArray, sql } from "drizzle-orm"

import type { BizUIMessage } from "../__internal__/types"

class AIPersistServiceStatic {
  async loadMessages(roomId: string) {
    return db.query.aiChatMessagesTable.findMany({
      where: eq(aiChatMessagesTable.roomId, roomId),
      orderBy: [asc(aiChatMessagesTable.createdAt)],
    })
  }

  async insertMessages(roomId: string, messages: BizUIMessage[]) {
    if (messages.length === 0) {
      return
    }

    await db.insert(aiChatMessagesTable).values(
      messages.map((message) => ({
        roomId,
        id: message.id,
        message,
        createdAt: message.metadata?.finishTime ? new Date(message.metadata.finishTime) : undefined,
      })),
    )
  }

  async replaceAllMessages(roomId: string, messages: BizUIMessage[]) {
    await db.delete(aiChatMessagesTable).where(eq(aiChatMessagesTable.roomId, roomId))
    await this.insertMessages(roomId, messages)
  }

  async createSession(roomId: string, title?: string) {
    await db.insert(aiChatTable).values({
      roomId,
      title,
      createdAt: new Date(),
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
    await db.update(aiChatTable).set({ title }).where(eq(aiChatTable.roomId, roomId))
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
