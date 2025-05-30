import { z } from "zod"

export const DB_BaseSchema = z.object({
  id: z.string(),
})

export type DB_Base = z.infer<typeof DB_BaseSchema>
