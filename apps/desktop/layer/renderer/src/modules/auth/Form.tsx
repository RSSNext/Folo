import { Button } from "@follow/components/ui/button/index.js"
import { Divider } from "@follow/components/ui/divider/index.js"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@follow/components/ui/form/index.js"
import { Input } from "@follow/components/ui/input/Input.js"
import type { LoginRuntime } from "@follow/shared/auth"
import { env } from "@follow/shared/env.desktop"
import HCaptcha from "@hcaptcha/react-hcaptcha"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRef } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { loginHandler, signUp, twoFactor } from "~/lib/auth"
import { handleSessionChanges } from "~/queries/auth"

import { TOTPForm } from "../profile/two-factor"

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
})

export function LoginWithPassword({
  runtime,
  onLoginStateChange,
}: {
  runtime: LoginRuntime
  onLoginStateChange: (state: "register" | "login") => void
}) {
  const { t } = useTranslation("app")
  const { t: tSettings } = useTranslation("settings")
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "all",
  })

  const { present } = useModalStack()

  const captchaRef = useRef<HCaptcha>(null)

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const response = await captchaRef.current?.execute({ async: true })
    const res = await loginHandler("credential", runtime, {
      email: values.email,
      password: values.password,
      headers: {
        "x-token": `hc:${response?.response}`,
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
                handleSessionChanges()
              }}
            />
          )
        },
      })
    } else {
      handleSessionChanges()
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
          {!import.meta.env.DEV && (
            <HCaptcha sitekey={env.VITE_HCAPTCHA_SITE_KEY} ref={captchaRef} size="invisible" />
          )}
          <Button
            type="submit"
            isLoading={form.formState.isSubmitting}
            disabled={!form.formState.isValid}
            size="lg"
          >
            {t("login.continueWith", { provider: t("words.email") })}
          </Button>
        </div>
      </form>

      <Divider className="my-4" />

      <div className="flex items-center justify-center gap-1 pb-2 text-center text-sm">
        If you don't have an account,{" "}
        <button
          type="button"
          className="text-accent flex cursor-pointer items-center gap-1 hover:underline"
          onClick={() => onLoginStateChange("register")}
        >
          Sign up
          <i className="i-mgc-right-cute-fi !text-text" />
        </button>
      </div>
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

export function RegisterForm({
  onLoginStateChange,
}: {
  onLoginStateChange: (state: "register" | "login") => void
}) {
  const { t } = useTranslation("app")

  const form = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "all",
  })

  const captchaRef = useRef<HCaptcha>(null)

  async function onSubmit(values: z.infer<typeof registerFormSchema>) {
    const response = await captchaRef.current?.execute({ async: true })
    return signUp.email({
      email: values.email,
      password: values.password,
      name: values.email.split("@")[0]!,
      callbackURL: "/",
      fetchOptions: {
        onSuccess() {
          handleSessionChanges()
        },
        onError(context) {
          toast.error(context.error.message)
        },
        headers: {
          "x-token": `hc:${response?.response}`,
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
          {!import.meta.env.DEV && (
            <HCaptcha sitekey={env.VITE_HCAPTCHA_SITE_KEY} ref={captchaRef} size="invisible" />
          )}
          <Button type="submit" buttonClassName="w-full" size="lg">
            {t("register.submit")}
          </Button>
        </form>
      </Form>
      <Divider className="my-4" />

      <div className="flex items-center justify-center gap-1 pb-2 text-center text-sm">
        If you already have an account,{" "}
        <button
          type="button"
          className="text-accent flex cursor-pointer items-center gap-1 hover:underline"
          onClick={() => onLoginStateChange("login")}
        >
          Sign in
          <i className="i-mgc-right-cute-fi !text-text" />
        </button>
      </div>
    </div>
  )
}
