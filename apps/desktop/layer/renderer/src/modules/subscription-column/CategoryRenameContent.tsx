import { Button } from "@follow/components/ui/button/index.js"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input } from "@follow/components/ui/input/index.js"
import { subscriptionSyncService } from "@follow/store/subscription/store"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"
import { apiClient } from "~/lib/api-fetch"

const formSchema = z.object({
  category: z.string(),
})

export function CategoryRenameContent({
  feedIdList,
  onSuccess,
  category,
}: {
  feedIdList: string[]
  onSuccess?: () => void
  category: string
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category,
    },
  })

  const renameMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) =>
      apiClient.categories.$patch({
        json: {
          feedIdList,
          category: values.category,
        },
      }),
    onSuccess: () => {
      subscriptionSyncService.fetch()

      onSuccess?.()
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    renameMutation.mutate(values)
  }

  const { setClickOutSideToDismiss } = useCurrentModal()

  useEffect(() => {
    setClickOutSideToDismiss(!form.formState.isDirty)
  }, [form.formState.isDirty])
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" isLoading={renameMutation.isPending}>
            Rename
          </Button>
        </div>
      </form>
    </Form>
  )
}
