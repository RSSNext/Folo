import { loginHandler, signUp } from "@client/lib/auth"
import { useAuthProviders } from "@client/query/users"
import { Logo } from "@follow/components/icons/logo.jsx"
import { Button, MotionButtonBase } from "@follow/components/ui/button/index.jsx"
import { Divider } from "@follow/components/ui/divider/index.js"
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
import { tracker } from "@follow/tracker"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useRef, useState } from "react"
import ReCAPTCHA from "react-google-recaptcha"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { z } from "zod"

function closeRecaptcha(
  recaptchaRef: React.RefObject<ReCAPTCHA | null>,
  setIsSubmitting: (value: boolean) => void,
) {
  const handleClick = (e: MouseEvent) => {
    const recaptchaIframeSelector =
      'iframe[src*="recaptcha/api2"], iframe[src*="www.recaptcha.net"], iframe[src*="google.com/recaptcha"]'
    const recaptchaChallengeIframe = document.querySelector(recaptchaIframeSelector)

    if (
      e.target instanceof Element &&
      recaptchaChallengeIframe &&
      !recaptchaChallengeIframe.contains(e.target) &&
      !e.target.closest(".g-recaptcha")
    ) {
      recaptchaRef.current?.reset()
      setIsSubmitting(false)
    }
  }

  document.addEventListener("click", handleClick)
  return () => document.removeEventListener("click", handleClick)
}

export function Component() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8">
      <Logo className="size-16" />
      <RegisterForm />
    </div>
  )
}

const formSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

function RegisterForm() {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const [isEmail, setIsEmail] = useState(false)

  const { data: authProviders } = useAuthProviders()

  useEffect(() => {
    if (isSubmitting) {
      return closeRecaptcha(recaptchaRef, setIsSubmitting)
    }
  }, [isSubmitting])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      const token = await recaptchaRef.current?.executeAsync()

      if (!token) {
        return
      }

      await signUp.email({
        email: values.email,
        password: values.password,
        name: values.email.split("@")[0]!,
        callbackURL: "/",
        fetchOptions: {
          onSuccess() {
            tracker.register({
              type: "email",
            })
            navigate("/login")
          },
          onError(context) {
            toast.error(context.error.message)
          },
          headers: {
            "x-token": `r2:${token}`,
          },
        },
      })
    } finally {
      if (recaptchaRef.current) {
        recaptchaRef.current.reset()
      }
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-w-80">
      <h1 className="mb-6 text-center text-2xl">
        {t("login.signUpTo")} <b>{` ${APP_NAME}`}</b>
      </h1>
      {isEmail ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("register.email")}</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("register.password")}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("register.confirm_password")}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} disabled={isSubmitting} />
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
            <Button
              isLoading={isSubmitting}
              disabled={isSubmitting}
              type="submit"
              className="w-full"
              size="lg"
            >
              {t("register.submit")}
            </Button>
          </form>
        </Form>
      ) : (
        <div className="mb-3 flex flex-col items-center justify-center gap-4">
          {Object.entries(authProviders || []).map(([key, provider]) => (
            <MotionButtonBase
              key={key}
              onClick={() => {
                if (key === "credential") {
                  setIsEmail(true)
                } else {
                  loginHandler(key, "app")
                }
              }}
              className="center hover:bg-material-medium relative w-full gap-2 rounded-xl border p-2.5 pl-5 font-semibold duration-200"
            >
              <img
                className="absolute left-9 h-5"
                style={{
                  color: provider.color,
                }}
                src={provider.icon64}
              />
              <span>{t("login.continueWith", { provider: provider.name })}</span>
            </MotionButtonBase>
          ))}
        </div>
      )}
      <Divider className="my-7" />
      {isEmail ? (
        <div className="cursor-pointer pb-2 text-center" onClick={() => setIsEmail(false)}>
          Back
        </div>
      ) : (
        <div
          className="cursor-pointer pb-2 text-center"
          onClick={() => {
            navigate("/login")
          }}
        >
          <Trans
            t={t}
            i18nKey="login.have_account"
            components={{
              strong: <span className="text-accent" />,
            }}
          />
        </div>
      )}
    </div>
  )
}
