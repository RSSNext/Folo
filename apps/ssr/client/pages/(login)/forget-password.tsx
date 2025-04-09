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
import { env } from "@follow/shared/env"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import ReCAPTCHA from "react-google-recaptcha"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { z } from "zod"

const createEmailSchema = (t: any) =>
  z
    .string()
    .min(1, { message: t("login.forget_password.email_required") })
    .email({ message: t("login.forget_password.email_invalid") })
    .refine(
      (email) => {
        const validDomainRegex = /^[^@]+@[^@]+\.[a-z]{2,}$/i
        const noMultipleAtSymbols = (email.match(/@/g) || []).length === 1
        const noInvalidCharsInDomain = !/[,\s]/.test(email.split("@")[1] || "")
        const validTLD = /\.[a-z]{2,}$/i.test(email)
        return (
          validDomainRegex.test(email) && noMultipleAtSymbols && noInvalidCharsInDomain && validTLD
        )
      },
      { message: t("login.forget_password.email_format_invalid") },
    )

const useCaptcha = () => {
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [isExecutingCaptcha, setIsExecutingCaptcha] = useState(false)

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (
        e.target instanceof Element &&
        !e.target.closest(".g-recaptcha") &&
        !e.target.closest("iframe") &&
        !e.target.closest('[style*="z-index: 2000000000"]')
      ) {
        const captchaPopup = document.querySelector('div[style*="z-index: 2000000000"]')
        if (captchaPopup && !captchaToken) {
          recaptchaRef.current?.reset()
          setCaptchaVerified(false)
        }
      }
    }

    document.addEventListener("click", handleDocumentClick)
    return () => document.removeEventListener("click", handleDocumentClick)
  }, [captchaToken])

  const executeCaptcha = async (): Promise<string | null> => {
    setIsExecutingCaptcha(true)
    try {
      let token = captchaToken

      if (!token && captchaVerified) {
        token = recaptchaRef.current?.getValue() || null
      }

      if (!token && !captchaVerified && recaptchaRef.current?.props.size !== "normal") {
        token = (await recaptchaRef.current?.executeAsync()) || null
      }

      return token
    } finally {
      setIsExecutingCaptcha(false)
    }
  }

  return {
    recaptchaRef,
    captchaVerified,
    setCaptchaVerified,
    captchaToken,
    setCaptchaToken,
    isExecutingCaptcha,
    executeCaptcha,
  }
}

export function Component() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const captcha = useCaptcha()

  const forgetPasswordFormSchema = z.object({
    email: createEmailSchema(t),
  })

  const form = useForm<z.infer<typeof forgetPasswordFormSchema>>({
    resolver: zodResolver(forgetPasswordFormSchema),
    defaultValues: { email: "" },
    mode: "onChange",
    delayError: 500,
  })

  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof forgetPasswordFormSchema>) => {
      if (captcha.isExecutingCaptcha) return null

      try {
        const token = await captcha.executeCaptcha()

        if (!token) {
          throw new Error(t("login.forget_password.recaptcha_required"))
        }

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

        return res
      } catch (error) {
        throw error instanceof Error ? error : new Error("Unknown error occurred")
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : String(error))
      captcha.setCaptchaToken(null)
      captcha.setCaptchaVerified(false)
      captcha.recaptchaRef.current?.reset()
    },
    onSuccess: () => {
      toast.success(t("login.forget_password.success"))
      captcha.setCaptchaToken(null)
    },
  })

  function onSubmit(values: z.infer<typeof forgetPasswordFormSchema>) {
    if (
      captcha.recaptchaRef.current?.props.size === "normal" &&
      (!captcha.captchaVerified || !captcha.captchaToken)
    ) {
      toast.error(t("login.forget_password.recaptcha_required"))
      return
    }

    if (updateMutation.isPending || captcha.isExecutingCaptcha) return

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
                      <Input type="email" placeholder="username@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="my-4 flex justify-center">
                <ReCAPTCHA
                  ref={captcha.recaptchaRef}
                  sitekey={env.VITE_RECAPTCHA_V2_SITE_KEY}
                  size="normal"
                  onChange={(token) => {
                    captcha.setCaptchaToken(token)
                    captcha.setCaptchaVerified(!!token)
                  }}
                />
              </div>

              <div className="text-right">
                <Button
                  disabled={
                    !form.formState.isValid ||
                    (captcha.recaptchaRef.current?.props.size === "normal" &&
                      !captcha.captchaToken) ||
                    captcha.isExecutingCaptcha
                  }
                  type="submit"
                  isLoading={updateMutation.isPending || captcha.isExecutingCaptcha}
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
