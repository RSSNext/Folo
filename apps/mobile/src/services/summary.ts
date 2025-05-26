import { db } from "@follow/database/src/db"
import { summariesTable } from "@follow/database/src/schemas"
import type { SummarySchema } from "@follow/database/src/schemas/types"
import { eq } from "drizzle-orm"

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
