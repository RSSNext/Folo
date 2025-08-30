import { Button } from "@follow/components/ui/button/index.js"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input, TextArea } from "@follow/components/ui/input/index.js"
import { Label } from "@follow/components/ui/label/index.jsx"
import type { AITask } from "@follow-app/client-sdk"
import { zodResolver } from "@hookform/resolvers/zod"
import dayjs from "dayjs"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"
import { useCreateAITaskMutation, useUpdateAITaskMutation } from "~/modules/ai-task/query"
import type { ScheduleType } from "~/modules/ai-task/types"
import { scheduleSchema } from "~/modules/ai-task/types"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"

import { ScheduleConfig } from "./schedule-config"

const MAX_PROMPT_LENGTH = 2000

const taskSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(50, "Title must be less than 50 characters"),
    prompt: z
      .string()
      .min(1, "Prompt is required")
      .max(MAX_PROMPT_LENGTH, "Prompt must be less than 2000 characters"),
    schedule: scheduleSchema,
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

type TaskFormData = z.infer<typeof taskSchema>

interface AITaskModalProps {
  task?: AITask // Existing task for editing (optional)
  prompt?: string
  onSubmit?: (data: TaskFormData) => void
}

// Convert existing task data to form format or use defaults
const getDefaultFormData = (task?: AITask, prompt?: string): TaskFormData => {
  // Get current date/time for default values
  const now = dayjs()

  if (!task) {
    // Default values for creating new task
    return {
      title: "AI Task",
      prompt: prompt || "",
      schedule: {
        type: "once",
        date: now.add(1, "hour").toISOString(),
      },
    }
  }
  if (prompt) {
    console.warn("Using provided prompt for existing task, ignoring task prompt", task, prompt)
  }

  // Convert existing task data for editing
  const { schedule } = task
  let formSchedule: TaskFormData["schedule"]

  switch (schedule.type) {
    case "once": {
      formSchedule = {
        type: "once",
        date: dayjs(schedule.date).toISOString(),
      }
      break
    }
    case "daily": {
      formSchedule = {
        type: "daily",
        timeOfDay: dayjs(schedule.timeOfDay).toISOString(),
      }
      break
    }
    case "weekly": {
      formSchedule = {
        type: "weekly",
        dayOfWeek: schedule.dayOfWeek,
        timeOfDay: dayjs(schedule.timeOfDay).toISOString(),
      }
      break
    }
    case "monthly": {
      formSchedule = {
        type: "monthly",
        dayOfMonth: schedule.dayOfMonth,
        timeOfDay: dayjs(schedule.timeOfDay).toISOString(),
      }
      break
    }
    default: {
      formSchedule = {
        type: "once",
        date: now.add(1, "hour").toISOString(),
      }
    }
  }

  return {
    title: task.name,
    prompt: task.prompt,
    schedule: formSchedule,
  }
}

export const AITaskModal = ({ task, prompt, onSubmit }: AITaskModalProps) => {
  const { dismiss } = useCurrentModal()
  const createAITaskMutation = useCreateAITaskMutation()
  const updateAITaskMutation = useUpdateAITaskMutation()
  const { t } = useTranslation("ai")
  const settingModalPresent = useSettingModal()

  const isEditing = !!task

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: getDefaultFormData(task, prompt),
  })

  const scheduleValue = form.watch("schedule")

  const handleScheduleChange = (newSchedule: ScheduleType) => {
    form.setValue("schedule", newSchedule)
  }

  const handleSubmit = async (data: TaskFormData) => {
    // Process the form data to ensure proper datetime format
    const processedData = {
      ...data,
      schedule: data.schedule,
    }

    // The optimistic mutations handle success/error toasts and error cases automatically
    if (isEditing) {
      // Update existing task
      updateAITaskMutation.mutate(
        {
          id: task.id,
          name: processedData.title,
          prompt: processedData.prompt,
          schedule: processedData.schedule,
        },
        {
          onSuccess: () => {
            toast.success(t("tasks.toast.updated"))
            onSubmit?.(processedData)
            dismiss()
          },
        },
      )
    } else {
      // Create new task
      createAITaskMutation.mutate(
        {
          name: processedData.title,
          prompt: processedData.prompt,
          schedule: processedData.schedule,
        },
        {
          onSuccess: () => {
            toast.success(t("tasks.toast.created"))
            onSubmit?.(processedData)
            dismiss()
          },
        },
      )
    }
  }

  const currentMutation = isEditing ? updateAITaskMutation : createAITaskMutation

  return (
    <div className="min-w-[400px] space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Task Basic Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <i className="i-mgc-file-upload-cute-re text-text-secondary size-4" />
              <h3 className="text-text text-sm font-medium">{t("tasks.section.info")}</h3>
            </div>

            <div className="space-y-2">
              <Label className="text-text pl-2 text-sm font-medium">{t("tasks.name")}</Label>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder={t("tasks.name_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Schedule Configuration Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <i className="i-mgc-calendar-time-add-cute-re text-text-secondary size-4" />
              <h3 className="text-text text-sm font-medium">{t("tasks.section.schedule")}</h3>
            </div>

            <ScheduleConfig
              value={scheduleValue}
              onChange={handleScheduleChange}
              errors={form.formState.errors.schedule as Record<string, string>}
            />
          </div>

          {/* AI Prompt Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <i className="i-mgc-magic-2-cute-re text-text-secondary size-4" />
              <h3 className="text-text text-sm font-medium">{t("tasks.section.instructions")}</h3>
            </div>

            <div className="space-y-2">
              <Label className="text-text pl-2 text-sm font-medium">{t("tasks.prompt")}</Label>
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <TextArea
                        placeholder={t("tasks.prompt_placeholder")}
                        className="min-h-[120px] resize-none px-3 py-2 text-sm leading-relaxed"
                        maxLength={2000}
                        {...field}
                      />
                    </FormControl>
                    <div className="flex items-center justify-between">
                      <div className="text-text-tertiary text-xs">{t("tasks.prompt_helper")}</div>
                      {field.value?.length > MAX_PROMPT_LENGTH * 0.8 && (
                        <div className="text-text-secondary text-xs font-medium">
                          {field.value.length}/{MAX_PROMPT_LENGTH}
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Form Actions */}

          <div className="flex items-center justify-end">
            {!task && (
              <button
                type="button"
                onClick={() => settingModalPresent("ai")}
                className="text-text-tertiary hover:text-text-secondary mr-auto flex items-center gap-1 text-xs underline-offset-2 hover:underline disabled:opacity-50"
                disabled={currentMutation.isPending}
              >
                <i className="i-mgc-settings-7-cute-re size-3" />
                {t("tasks.view_in_settings")}
              </button>
            )}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={dismiss}
                disabled={currentMutation.isPending}
              >
                {t("words.cancel", { ns: "common" })}
              </Button>
              <Button type="submit" size="sm" disabled={currentMutation.isPending}>
                {currentMutation.isPending
                  ? isEditing
                    ? t("tasks.actions.updating")
                    : t("tasks.actions.scheduling")
                  : isEditing
                    ? t("tasks.actions.update")
                    : t("tasks.actions.schedule")}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}

AITaskModal.displayName = "AITaskModal"
