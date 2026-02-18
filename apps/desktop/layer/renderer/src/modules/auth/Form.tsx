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
import { IN_ELECTRON } from "@follow/shared/constants"
import { env } from "@follow/shared/env.desktop"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useRecaptchaToken } from "~/hooks/common"
import { loginHandler, signUp, twoFactor } from "~/lib/auth"
import { handleSessionChanges } from "~/queries/auth"

import { TOTPForm } from "../profile/two-factor"

const formSchema = z.object({
  email: z.string().email(),
  password: IN_ELECTRON ? z.string().min(8).max(128) : z.string().min(8).max(128).or(z.literal("")),
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
  const requestRecaptchaToken = useRecaptchaToken()

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const recaptchaToken = await requestRecaptchaToken("desktop_login")
    const headers = recaptchaToken
      ? {
          "x-token": `r3:${recaptchaToken}`,
        }
      : undefined

    if (!IN_ELECTRON && (!values.password || values.password.trim() === "")) {
      const result = await loginHandler("magicLink", runtime, {
        email: values.email,
        headers,
      })

      if (result?.error) {
        toast.error(result.error.message)
        return
      }

      toast.success(t("login.magic_link_sent"))
      return
    }

    // Use password authentication
    const res = await loginHandler("credential", runtime, {
      email: values.email,
      password: values.password,
      headers,
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
                <span>
                  {IN_ELECTRON
                    ? t("login.password")
                    : `${t("login.password")} (${t("login.password_optional")})`}
                </span>
                <a
                  href={`${env.VITE_WEB_URL}/forget-password`}
                  target="_blank"
                  rel="noreferrer"
                  tabIndex={-1}
                  className="block py-1 text-xs text-accent hover:underline"
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
          <Button
            type="submit"
            isLoading={form.formState.isSubmitting}
            disabled={!form.formState.isValid}
            size="lg"
          >
            {IN_ELECTRON || (form.watch("password") && form.watch("password")?.trim() !== "")
              ? t("login.continueWith", { provider: t("words.email") })
              : t("login.send_magic_link")}
          </Button>
        </div>
      </form>

      <Divider className="my-4" />

      <div className="flex items-center justify-center gap-1 pb-2 text-center text-sm">
        If you don't have an account,{" "}
        <button
          type="button"
          className="flex cursor-pointer items-center gap-1 text-accent hover:underline"
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
    password: IN_ELECTRON
      ? z.string().min(8).max(128)
      : z.string().min(8).max(128).or(z.literal("")),
    confirmPassword: IN_ELECTRON ? z.string() : z.string().or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export function RegisterForm({
  runtime,
  onLoginStateChange,
}: {
  runtime: LoginRuntime
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

  const requestRecaptchaToken = useRecaptchaToken()

  async function onSubmit(values: z.infer<typeof registerFormSchema>) {
    const recaptchaToken = await requestRecaptchaToken("desktop_register")
    const headers = recaptchaToken
      ? {
          "x-token": `r3:${recaptchaToken}`,
        }
      : undefined

    if (!IN_ELECTRON && (!values.password || values.password.trim() === "")) {
      const result = await loginHandler("magicLink", runtime, {
        email: values.email,
        headers,
      })

      if (result?.error) {
        toast.error(result.error.message)
        return
      }

      toast.success(t("register.magic_link_sent"))
      return
    }

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
        headers,
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
                <FormLabel>
                  {IN_ELECTRON
                    ? t("register.password")
                    : `${t("register.password")} (${t("register.password_optional")})`}
                </FormLabel>
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
                <FormLabel>
                  {IN_ELECTRON
                    ? t("register.confirm_password")
                    : `${t("register.confirm_password")} (${t("register.password_optional")})`}
                </FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            buttonClassName="w-full"
            size="lg"
            isLoading={form.formState.isSubmitting}
            disabled={!form.formState.isValid}
          >
            {IN_ELECTRON || (form.watch("password") && form.watch("password")?.trim() !== "")
              ? t("register.submit")
              : t("register.send_magic_link")}
          </Button>
        </form>
      </Form>
      <Divider className="my-4" />

      <div className="flex items-center justify-center gap-1 pb-2 text-center text-sm">
        If you already have an account,{" "}
        <button
          type="button"
          className="flex cursor-pointer items-center gap-1 text-accent hover:underline"
          onClick={() => onLoginStateChange("login")}
        >
          Sign in
          <i className="i-mgc-right-cute-fi !text-text" />
        </button>
      </div>
    </div>
  )
}
