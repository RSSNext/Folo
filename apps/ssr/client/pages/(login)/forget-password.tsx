import { useRecaptchaToken } from "@client/hooks/useRecaptchaToken"
import { requestPasswordReset } from "@client/lib/auth"
import { Button } from "@follow/components/ui/button/index.jsx"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@follow/components/ui/card/index.jsx"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input } from "@follow/components/ui/input/index.js"
import { env } from "@follow/shared/env.ssr"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import * as React from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

const createEmailSchema = (t: any) =>
  z.object({
    email: z
      .string()
      .min(1, t("login.forget_password.email_required"))
      .email(t("login.forget_password.email_invalid")),
  })

export function Component() {
  const { t } = useTranslation()

  const requestRecaptchaToken = useRecaptchaToken()

  const EmailSchema = createEmailSchema(t)

  const form = useForm<z.infer<typeof EmailSchema>>({
    resolver: zodResolver(EmailSchema),
    defaultValues: {
      email: "",
    },
    mode: "onChange",
    delayError: 500,
  })

  const { isValid } = form.formState
  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof EmailSchema>) => {
      const recaptchaToken = await requestRecaptchaToken("ssr_forget_password")
      const res = await requestPasswordReset(
        {
          email: values.email,
          redirectTo: `${env.VITE_WEB_URL}/reset-password`,
        },
        {
          headers: recaptchaToken
            ? {
                "x-token": `r3:${recaptchaToken}`,
              }
            : undefined,
        },
      )
      if (res.error) {
        throw new Error(res.error.message)
      }
    },
    onError: (error) => {
      toast.error(error.message)
    },
    onSuccess: () => {
      toast.success(t("login.forget_password.success"))
    },
  })

  function onSubmit(values: z.infer<typeof EmailSchema>) {
    updateMutation.mutate(values)
  }

  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-[500px] max-w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>{t("login.forget_password.label")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-4">
            {t("login.forget_password.description")}
          </CardDescription>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("login.email")}</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="text-right">
                <Button
                  disabled={!isValid || updateMutation.isPending}
                  type="submit"
                  isLoading={updateMutation.isPending}
                >
                  {t("login.submit")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
