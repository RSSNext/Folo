import dayjs from "dayjs"
import { z } from "zod"

export const MAX_PROMPT_LENGTH = 2000

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

// AI Task Options (notification channels etc.)
// Keep in sync with backend schema.
export const aiTaskOptionsSchema = z.object({
  notifyChannels: z
    .array(z.enum(["email"]))
    .describe("Notification channels to use. Currently only 'email' supported."),
})

export type AITaskOptions = z.infer<typeof aiTaskOptionsSchema>

export const taskSchema = z
  .object({
    name: z.string().min(1, "Title is required").max(50, "Title must be less than 50 characters"),
    prompt: z
      .string()
      .min(1, "Prompt is required")
      .max(MAX_PROMPT_LENGTH, "Prompt must be less than 2000 characters"),
    schedule: scheduleSchema,
    options: aiTaskOptionsSchema,
  })
  .refine(
    (data) => {
      // Validate that for "once" type, the date is in the future
      if (data.schedule.type === "once") {
        const scheduledDate = dayjs(data.schedule.date)
        const now = dayjs()
        return scheduledDate.isAfter(now)
      }
      return true
    },
    {
      message: "Scheduled date must be in the future",
      path: ["schedule", "date"],
    },
  )

export type TaskFormData = z.infer<typeof taskSchema>
