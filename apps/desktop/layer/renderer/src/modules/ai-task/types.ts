import { z } from "zod"

// AI Schedule Schema
export const scheduleSchema = z.union([
  z.object({
    type: z.literal("once"),
    date: z.string().datetime(),
  }),
  z.object({
    type: z.literal("daily"),
    timeOfDay: z.string().datetime(),
  }),
  z.object({
    type: z.literal("weekly"),
    dayOfWeek: z.number().min(0).max(6),
    timeOfDay: z.string().datetime(),
  }),
  z.object({
    type: z.literal("monthly"),
    dayOfMonth: z.number().min(1).max(31),
    timeOfDay: z.string().datetime(),
  }),
])

export type ScheduleType = z.infer<typeof scheduleSchema>
