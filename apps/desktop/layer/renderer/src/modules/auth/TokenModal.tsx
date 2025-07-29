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
import { toast } from "sonner"
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
    try {
      const inputToken = values.token.trim()
      let token = inputToken
      if (URL.canParse(inputToken)) {
        // If the input is a valid URL, extract the token from the URL
        const urlObj = new URL(inputToken)
        if (urlObj.searchParams.has("token")) {
          token = urlObj.searchParams.get("token") || ""
        }
      } else if (inputToken.startsWith("auth?token=")) {
        token = inputToken.slice("auth?token=".length)
      }
      await oneTimeToken.apply({ token })
      handleSessionChanges()
    } catch (e) {
      console.error("Failed to apply one-time token:", e)
      toast.error("Failed to apply one-time token")
    } finally {
      setIsLoading(false)
    }
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
