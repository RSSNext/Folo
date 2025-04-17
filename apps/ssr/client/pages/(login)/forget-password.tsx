import { forgetPassword } from "@client/lib/auth"
import { Button, MotionButtonBase } from "@follow/components/ui/button/index.jsx"
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
import { useEffect, useRef } from "react"
import ReCAPTCHA from "react-google-recaptcha"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { z } from "zod"

function closeRecaptcha(
  recaptchaRef: React.RefObject<ReCAPTCHA>,
  mutation?: { reset: () => void },
) {
  const handleClick = (e: MouseEvent) => {
    const recaptchaIframeSelector =
      'iframe[src*="recaptcha/api2"], iframe[src*="www.recaptcha.net"], iframe[src*="google.com/recaptcha"]'
    const recaptchaChallengeIframe = document.querySelector(recaptchaIframeSelector)

    if (
      e.target instanceof Element &&
      (!recaptchaChallengeIframe || !recaptchaChallengeIframe.contains(e.target)) &&
      !e.target.closest(".g-recaptcha") &&
      recaptchaChallengeIframe
    ) {
      recaptchaRef.current?.reset()
      mutation?.reset()
    }
  }

  document.addEventListener("click", handleClick)
  return () => document.removeEventListener("click", handleClick)
}

const createEmailSchema = (t: any) =>
  z.object({
    email: z
      .string()
      .min(1, t("login.forget_password.email_required"))
      .email(t("login.forget_password.email_invalid")),
  })

export function Component() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const recaptchaRef = useRef<ReCAPTCHA>(null)

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
      const token = await recaptchaRef.current?.executeAsync()
      const res = await forgetPassword(
        {
          email: values.email,
          redirectTo: `${env.VITE_WEB_URL}/reset-password`,
        },
        {
          headers: {
            "x-token": `r2:${token}`,
          },
        },
      )
      if (res.error) {
        throw new Error(res.error.message)
      }
    },
    onError: (error) => {
      recaptchaRef.current?.reset()
      toast.error(error.message)
    },
    onSuccess: () => {
      toast.success(t("login.forget_password.success"))
    },
    onSettled: () => {
      recaptchaRef.current?.reset()
    },
  })

  useEffect(() => {
    return closeRecaptcha(recaptchaRef, updateMutation)
  }, [updateMutation])

  function onSubmit(values: z.infer<typeof EmailSchema>) {
    updateMutation.mutate(values)
  }

  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-[350px] max-w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MotionButtonBase
              onClick={() => {
                history.length > 1 ? history.back() : navigate("/login")
              }}
              className="-ml-1 inline-flex cursor-pointer items-center"
            >
              <i className="i-mingcute-left-line" />
            </MotionButtonBase>
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
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={env.VITE_RECAPTCHA_V2_SITE_KEY}
                size="invisible"
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
