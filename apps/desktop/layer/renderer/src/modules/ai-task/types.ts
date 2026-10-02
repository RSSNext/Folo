import dayjs from "dayjs"
import type { TFunction } from "i18next"
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

export const createTaskSchema = (t: TFunction<"ai">) =>
  z
    .object({
      name: z
        .string()
        .min(1, t("tasks.validation.title_required"))
        .max(50, t("tasks.validation.title_max")),
      prompt: z
        .string()
        .min(1, t("tasks.validation.prompt_required"))
        .max(MAX_PROMPT_LENGTH, t("tasks.validation.prompt_max")),
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
        message: t("tasks.validation.date_future"),
        path: ["schedule", "date"],
      },
    )

export type TaskFormData = z.infer<ReturnType<typeof createTaskSchema>>
