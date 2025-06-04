import { Button } from "@follow/components/ui/button/index.js"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input } from "@follow/components/ui/input/index.js"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { oneTimeToken } from "~/lib/auth"
import { handleSessionChanges } from "~/queries/auth"

const formSchema = z.object({
  token: z.string().min(1),
})

export const TokenModalContent = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })
  const { t } = useTranslation("common")
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    const urlObj = new URL(values.token)
    const token = urlObj.searchParams.get("token")
    if (token) {
      await oneTimeToken.apply({ token })
      handleSessionChanges()
    }
    setIsLoading(false)
  }

  return (
    <div className="size-full overflow-hidden">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-[512px] max-w-full overflow-hidden px-0.5"
        >
          <FormField
            control={form.control}
            name="token"
            render={({ field }) => (
              <FormItem className="flex flex-col items-center gap-2 md:block">
                <FormControl>
                  <Input
                    className="mt-1 dark:text-zinc-200"
                    placeholder="folo://auth?token=xxx"
                    {...field}
                  />
                </FormControl>
                <div className="h-6">
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <div className="center relative flex">
            <Button
              variant="primary"
              type="submit"
              disabled={!form.formState.isValid}
              isLoading={isLoading}
            >
              {t("words.submit")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
