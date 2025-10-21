import { Button } from "@follow/components/ui/button/index.js"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input } from "@follow/components/ui/input/index.js"
import { Label } from "@follow/components/ui/label/index.jsx"
import type { LexicalRichEditorRef } from "@follow/components/ui/lexical-rich-editor/index.js"
import { LexicalRichEditorTextArea } from "@follow/components/ui/lexical-rich-editor/index.js"
import type { AITask } from "@follow-app/client-sdk"
import { zodResolver } from "@hookform/resolvers/zod"
import dayjs from "dayjs"
import { useRef, useState } from "react"
import type { GlobalError } from "react-hook-form"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"
import { MentionPlugin, ShortcutPlugin } from "~/modules/ai-chat/editor"
import { AIPersistService } from "~/modules/ai-chat/services"
import { useCreateAITaskMutation, useUpdateAITaskMutation } from "~/modules/ai-task/query"
import type { ScheduleType, TaskFormData } from "~/modules/ai-task/types"
import { MAX_PROMPT_LENGTH, taskSchema } from "~/modules/ai-task/types"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"

import { NotifyChannelsConfig } from "./notify-channels-config"
import { ScheduleConfig } from "./schedule-config"

interface AITaskModalProps {
  task?: AITask // Existing task for editing (optional)
  prompt?: string
  /**
   * Explicitly control whether to show the "open settings" tip/link.
   */
  showSettingsTip?: boolean
}

// Convert existing task data to form format or use defaults
const getDefaultFormData = (task?: AITask, prompt?: string): TaskFormData => {
  // Get current date/time for default values
  const now = dayjs()

  if (!task) {
    // Default values for creating new task
    return {
      name: "AI Task",
      prompt: prompt || "",
      schedule: {
        type: "once",
        date: now.add(1, "hour").toISOString(),
      },
      options: { notifyChannels: ["email"] },
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
    name: task.name,
    prompt: task.prompt,
    schedule: formSchedule,
    options: { notifyChannels: ["email"], ...task.options },
  }
}

export const AITaskModal = ({ task, prompt, showSettingsTip = false }: AITaskModalProps) => {
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
  const notifyChannelsValue = form.watch("options.notifyChannels")

  // Uncontrolled prompt state handled outside react-hook-form
  const initialPromptRef = useRef(form.getValues("prompt"))
  const promptEditorRef = useRef<LexicalRichEditorRef | null>(null)
  const [promptTextLength, setPromptTextLength] = useState(0)

  const handleScheduleChange = (newSchedule: ScheduleType) => {
    form.setValue("schedule", newSchedule)
  }

  const handleSubmit = async (data: TaskFormData) => {
    // The optimistic mutations handle success/error toasts and error cases automatically
    if (isEditing) {
      // Update existing task
      updateAITaskMutation.mutate(
        {
          id: task.id,
          ...data,
        },
        {
          onSuccess: async () => {
            // If task name changed, sync the AI chat session title (chatId === task.id)
            const trimmedTitle = data.name?.trim()
            if (trimmedTitle) {
              try {
                await AIPersistService.updateSessionTitle(task.id, trimmedTitle)
              } catch (err) {
                console.error("Failed to update AI session title:", err, task, data)
              }
            }
            toast.success(t("tasks.toast.updated"))
            dismiss()
          },
        },
      )
    } else {
      // Create new task
      createAITaskMutation.mutate(data, {
        onSuccess: () => {
          toast.success(t("tasks.toast.created"))
          dismiss()
        },
      })
    }
  }

  const currentMutation = isEditing ? updateAITaskMutation : createAITaskMutation

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    if (!promptEditorRef.current) return
    const promptValue = JSON.stringify(
      promptEditorRef.current?.getEditor().getEditorState().toJSON(),
    )

    form.setValue("prompt", promptValue, { shouldDirty: true, shouldValidate: true })
    return form.handleSubmit(handleSubmit)(e)
  }

  return (
    <div className="w-[500px] max-w-full space-y-6">
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Task Basic Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <i className="i-mgc-file-upload-cute-re size-4 text-text-secondary" />
              <h3 className="text-sm font-medium text-text">{t("tasks.section.info")}</h3>
            </div>

            <div className="space-y-2">
              <Label className="pl-2 text-sm font-medium text-text">{t("tasks.name")}</Label>
              <FormField
                control={form.control}
                name="name"
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
              <i className="i-mgc-calendar-time-add-cute-re size-4 text-text-secondary" />
              <h3 className="text-sm font-medium text-text">{t("tasks.section.schedule")}</h3>
            </div>

            <ScheduleConfig
              value={scheduleValue}
              onChange={handleScheduleChange}
              errors={form.formState.errors.schedule as Record<string, GlobalError>}
            />
          </div>

          {/* AI Prompt Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <i className="i-mgc-magic-2-cute-re size-4 text-text-secondary" />
              <h3 className="text-sm font-medium text-text">{t("tasks.section.instructions")}</h3>
            </div>

            <div className="space-y-2">
              <Label className="pl-2 text-sm font-medium text-text">{t("tasks.prompt")}</Label>
              <LexicalRichEditorTextArea
                initialValue={initialPromptRef.current}
                ref={promptEditorRef}
                onLengthChange={(textLength) => {
                  setPromptTextLength(textLength)
                }}
                plugins={[MentionPlugin, ShortcutPlugin]}
                namespace="AITaskPromptEditor"
                placeholder={t("tasks.prompt_placeholder")}
                className="min-h-[120px] resize-none text-sm leading-relaxed"
              />
              <div className="flex items-center justify-between">
                <div className="text-xs text-text-tertiary">{t("tasks.prompt_helper")}</div>
                {promptTextLength > MAX_PROMPT_LENGTH * 0.8 && (
                  <div className="text-xs font-medium text-text-secondary">
                    {promptTextLength}/{MAX_PROMPT_LENGTH}
                  </div>
                )}
              </div>
              {(form.formState.errors.prompt as GlobalError | undefined)?.message && (
                <div className="text-xs text-red">
                  {(form.formState.errors.prompt as GlobalError).message}
                </div>
              )}
            </div>
          </div>

          {/* Notification Channels Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <i className="i-mgc-notification-cute-re size-4 text-text-secondary" />
              <h3 className="text-sm font-medium text-text">{t("tasks.section.notifications")}</h3>
            </div>
            <NotifyChannelsConfig
              value={notifyChannelsValue}
              onChange={(channels) => form.setValue("options.notifyChannels", channels)}
            />
          </div>

          {/* Form Actions */}

          <div className="flex items-center justify-end">
            {showSettingsTip && (
              <button
                type="button"
                onClick={() => settingModalPresent("ai")}
                className="mr-auto flex items-center gap-1 text-xs text-text-tertiary underline-offset-2 hover:text-text-secondary hover:underline disabled:opacity-50"
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
