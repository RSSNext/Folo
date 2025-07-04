import { db } from "@follow/database/db"
import { aiChatMessagesTable } from "@follow/database/schemas/index"
import { asc, eq } from "drizzle-orm"

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
}
export const AIPersistService = new AIPersistServiceStatic()
