import { Button } from "@follow/components/ui/button/index.js"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { TextArea } from "@follow/components/ui/input/index.js"
import type { AITask } from "@follow-app/client-sdk"
import { zodResolver } from "@hookform/resolvers/zod"
import dayjs from "dayjs"
import { memo } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"
import { useCreateAITaskMutation, useUpdateAITaskMutation } from "~/modules/ai-task/query"
import type { ScheduleType } from "~/modules/ai-task/types"
import { scheduleSchema } from "~/modules/ai-task/types"

import { AITaskModalHeader } from "./ai-task-modal-header"
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

export const AITaskModal = memo<AITaskModalProps>(({ task, prompt, onSubmit }) => {
  const { dismiss } = useCurrentModal()
  const createAITaskMutation = useCreateAITaskMutation()
  const updateAITaskMutation = useUpdateAITaskMutation()

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
    try {
      // Process the form data to ensure proper datetime format
      const processedData = {
        ...data,
        schedule: data.schedule,
      }

      if (isEditing) {
        // Update existing task
        await updateAITaskMutation.mutateAsync({
          id: task.id,
          name: processedData.title,
          prompt: processedData.prompt,
          schedule: processedData.schedule,
        })
        toast.success("AI task updated successfully")
      } else {
        // Create new task
        await createAITaskMutation.mutateAsync({
          name: processedData.title,
          prompt: processedData.prompt,
          schedule: processedData.schedule,
        })
        toast.success("AI task scheduled successfully")
      }

      // Call the optional onSubmit callback
      onSubmit?.(processedData)
      dismiss()
    } catch (error) {
      console.error(`Failed to update/create AI task:`, error)
      toast.error(`Failed to ${isEditing ? "update" : "schedule"} AI task. Please try again.`)
    }
  }

  const currentMutation = isEditing ? updateAITaskMutation : createAITaskMutation

  return (
    <>
      <AITaskModalHeader
        title={form.watch("title")}
        error={form.formState.errors.title?.message as string | undefined}
        onClose={dismiss}
        onSaveTitle={async (newTitle) => {
          form.setValue("title", newTitle, { shouldValidate: true, shouldDirty: true })
        }}
      />

      <div className="w-[500px] space-y-6 p-6">
        <div className="space-y-2">
          <h2 className="text-text text-lg font-semibold">
            {isEditing ? "Edit AI Task" : "Schedule AI Task"}
          </h2>
          <p className="text-text-secondary text-sm">
            {isEditing
              ? "Modify the details and schedule of your AI task."
              : "Create an automated AI task that will run according to your schedule."}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Task Details */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AI Prompt</FormLabel>
                    <FormDescription>
                      The prompt that will be sent to AI when this task runs
                    </FormDescription>
                    <FormControl>
                      <TextArea
                        placeholder="Enter the AI prompt to execute..."
                        className="min-h-[100px] resize-none"
                        maxLength={2000}
                        {...field}
                      />
                    </FormControl>
                    {field.value?.length > MAX_PROMPT_LENGTH * 0.8 && (
                      <FormDescription>{`${field.value.length}/${MAX_PROMPT_LENGTH} characters`}</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Schedule Configuration */}
            <ScheduleConfig
              value={scheduleValue}
              onChange={handleScheduleChange}
              errors={form.formState.errors.schedule as Record<string, string>}
            />

            {/* Form Actions */}
            <div className="border-border flex justify-end space-x-3 border-t pt-4">
              <Button type="button" variant="ghost" onClick={dismiss}>
                Cancel
              </Button>
              <Button type="submit" disabled={currentMutation.isPending}>
                {currentMutation.isPending ? (
                  <>
                    <i className="i-mgc-loading-3-cute-re mr-2 size-4 animate-spin" />
                    {isEditing ? "Updating..." : "Scheduling..."}
                  </>
                ) : (
                  <>
                    <i
                      className={`mr-2 size-4 ${isEditing ? "i-mgc-edit-cute-re" : "i-mgc-calendar-time-add-cute-re"}`}
                    />
                    {isEditing ? "Update Task" : "Schedule Task"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  )
})

AITaskModal.displayName = "AITaskModal"
