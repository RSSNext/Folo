import { Button } from "@follow/components/ui/button/index.js"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@follow/components/ui/form/index.js"
import { Input } from "@follow/components/ui/input/Input.js"
import { env } from "@follow/shared/env.desktop"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRef } from "react"
import ReCAPTCHA from "react-google-recaptcha"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import { useCurrentModal, useModalStack } from "~/components/ui/modal/stacked/hooks"
import type { LoginRuntime } from "~/lib/auth"
import { loginHandler, signUp, twoFactor } from "~/lib/auth"

import { TOTPForm } from "../profile/two-factor"

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
})

export function LoginWithPassword({ runtime }: { runtime: LoginRuntime }) {
  const { t } = useTranslation("app")
  const { t: tSettings } = useTranslation("settings")
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const { present } = useModalStack()
  const { dismiss } = useCurrentModal()

  const recaptchaRef = useRef<ReCAPTCHA>(null)

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const token = await recaptchaRef.current?.executeAsync()
    const res = await loginHandler("credential", runtime, {
      email: values.email,
      password: values.password,
      headers: {
        "x-token": `r2:${token}`,
      },
    })
    if (res?.error) {
      toast.error(res.error.message)
      return
    }

    if ((res?.data as any)?.twoFactorRedirect) {
      present({
        title: tSettings("profile.totp_code.title"),
        content: () => {
          return (
            <TOTPForm
              onSubmitMutationFn={async (values) => {
                const { data, error } = await twoFactor.verifyTotp({ code: values.code })
                if (!data || error) {
                  throw new Error(error?.message ?? "Invalid TOTP code")
                }
              }}
              onSuccess={() => {
                window.location.reload()
              }}
            />
          )
        },
      })
    } else {
      window.location.reload()
    }
  }

  return (
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
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel className="flex items-center justify-between">
                <span>{t("login.password")}</span>
                <a
                  href={`${env.VITE_WEB_URL}/forget-password`}
                  target="_blank"
                  rel="noreferrer"
                  tabIndex={-1}
                  className="text-accent block py-1 text-xs hover:underline"
                >
                  {t("login.forget_password.note")}
                </a>
              </FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col space-y-3">
          <ReCAPTCHA ref={recaptchaRef} sitekey={env.VITE_RECAPTCHA_V2_SITE_KEY} size="invisible" />
          <Button
            type="submit"
            isLoading={form.formState.isSubmitting}
            disabled={!form.formState.isValid}
            size="lg"
          >
            {t("login.continueWith", { provider: t("words.email") })}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => {
              dismiss()
              present({
                content: RegisterForm,
                title: t("register.label", { app_name: APP_NAME }),
              })
            }}
          >
            {t("login.signUp")}
          </Button>
        </div>
      </form>
    </Form>
  )
}

const registerFormSchema = z
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
  const { t } = useTranslation("app")

  const form = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const { isValid } = form.formState

  const recaptchaRef = useRef<ReCAPTCHA>(null)

  async function onSubmit(values: z.infer<typeof registerFormSchema>) {
    const token = await recaptchaRef.current?.executeAsync()
    return signUp.email({
      email: values.email,
      password: values.password,
      name: values.email.split("@")[0]!,
      callbackURL: "/",
      fetchOptions: {
        onSuccess() {
          window.location.reload()
        },
        onError(context) {
          toast.error(context.error.message)
        },
        headers: {
          "x-token": `r2:${token}`,
        },
      },
    })
  }

  return (
    <div className="relative">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("register.email")}</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
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
                  <Input type="password" {...field} />
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
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <ReCAPTCHA ref={recaptchaRef} sitekey={env.VITE_RECAPTCHA_V2_SITE_KEY} size="invisible" />
          <Button disabled={!isValid} type="submit" className="w-full" size="lg">
            {t("register.submit")}
          </Button>
        </form>
      </Form>
    </div>
  )
}
