import { db } from "@follow/database/db"
import { aiChatMessagesTable, aiChatTable } from "@follow/database/schemas/index"
import { asc, eq, sql } from "drizzle-orm"

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
    const chats = await db
      .select({
        roomId: aiChatTable.roomId,
        title: aiChatTable.title,
        createdAt: aiChatTable.createdAt,
      })
      .from(aiChatTable)
      .orderBy(sql`${aiChatTable.createdAt} DESC`)
      .limit(limit)

    const result = await Promise.all(
      chats.map(async (chat) => {
        const messageCount = await db
          .select({ count: sql<number>`count(*)`.as("count") })
          .from(aiChatMessagesTable)
          .where(eq(aiChatMessagesTable.roomId, chat.roomId))
          .then((res) => res[0]?.count || 0)

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
    // Find sessions with no messages
    const emptySessions = await db
      .select({ roomId: aiChatTable.roomId })
      .from(aiChatTable)
      .leftJoin(aiChatMessagesTable, eq(aiChatTable.roomId, aiChatMessagesTable.roomId))
      .groupBy(aiChatTable.roomId)
      .having(sql`count(${aiChatMessagesTable.id}) = 0`)

    // Delete empty sessions
    if (emptySessions.length > 0) {
      await db
        .delete(aiChatTable)
        .where(
          sql`${aiChatTable.roomId} IN (${emptySessions.map((s) => `'${s.roomId}'`).join(",")})`,
        )
    }
  }
}
export const AIPersistService = new AIPersistServiceStatic()
