import { eq } from "drizzle-orm"

import { db } from "../db"
import { summariesTable } from "../schemas"
import type { SummarySchema } from "../schemas/types"

class SummaryServiceStatic {
  async insertSummary(data: Omit<SummarySchema, "createdAt">) {
    const updateExceptEmpty = Object.fromEntries(
      Object.entries({
        summary: data.summary,
        readabilitySummary: data.readabilitySummary,
      }).filter(([_, value]) => !!value),
    )

    await db
      .insert(summariesTable)
      .values({
        ...data,
        createdAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [summariesTable.entryId, summariesTable.language],
        set: updateExceptEmpty,
      })
  }

  async getSummary(entryId: string) {
    const summary = await db.query.summariesTable.findFirst({
      where: eq(summariesTable.entryId, entryId),
    })

    return summary
  }

  async deleteSummary(entryId: string) {
    await db.delete(summariesTable).where(eq(summariesTable.entryId, entryId))
  }
}

export const summaryService = new SummaryServiceStatic()
