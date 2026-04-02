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
import { Trans, useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useRecaptchaToken } from "~/hooks/common"
import { loginHandler, signUp, twoFactor } from "~/lib/auth"
import { ipcServices } from "~/lib/client"
import { setAuthSessionToken } from "~/lib/client-session"
import { handleSessionChanges } from "~/queries/auth"

import { TOTPForm } from "../profile/two-factor"

const formSchema = z.object({
  email: z.string().email(),
  password: IN_ELECTRON ? z.string().min(8).max(128) : z.string().min(8).max(128).or(z.literal("")),
})

const getAuthTokenFromResult = (result: unknown) => {
  if (!result || typeof result !== "object") {
    return null
  }

  if ("token" in result && typeof result.token === "string") {
    return result.token
  }

  if ("sessionToken" in result && typeof result.sessionToken === "string") {
    return result.sessionToken
  }

  if (
    "data" in result &&
    result.data &&
    typeof result.data === "object" &&
    ("sessionToken" in result.data || "token" in result.data)
  ) {
    const { sessionToken, token } = result.data as { sessionToken?: unknown; token?: unknown }
    if (typeof token === "string") {
      return token
    }
    return typeof sessionToken === "string" ? sessionToken : null
  }

  return null
}

type ElectronAuthResult = {
  data?: Record<string, unknown>
  error?: {
    message: string
    status?: number
  } | null
}

const normalizeElectronAuthResult = (result: unknown): ElectronAuthResult => {
  if (!result || typeof result !== "object") {
    return {}
  }

  return result as ElectronAuthResult
}

const setElectronSessionToken = async (token: string) => {
  if (!ipcServices) {
    return
  }

  const authService = ipcServices.auth as
    | (typeof ipcServices.auth & {
        setSessionToken?: (token: string) => Promise<void>
      })
    | undefined

  await authService?.setSessionToken?.(token)
}

const getElectronAuthService = () => {
  if (!ipcServices) {
    return null
  }

  return ipcServices.auth as typeof ipcServices.auth & {
    setSessionToken?: (token: string) => Promise<void>
    signInWithCredential?: (payload: {
      email: string
      password: string
      headers?: Record<string, string>
    }) => Promise<unknown>
    signUpWithCredential?: (payload: {
      email: string
      password: string
      name: string
      callbackURL: string
      headers?: Record<string, string>
    }) => Promise<unknown>
    verifyTotp?: (payload: {
      code: string
      trustDevice?: boolean
      headers?: Record<string, string>
    }) => Promise<unknown>
  }
}

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
    const res = IN_ELECTRON
      ? normalizeElectronAuthResult(
          await getElectronAuthService()?.signInWithCredential?.({
            email: values.email,
            password: values.password,
            headers,
          }),
        )
      : await loginHandler("credential", runtime, {
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
                const result = IN_ELECTRON
                  ? normalizeElectronAuthResult(
                      await getElectronAuthService()?.verifyTotp?.({
                        code: values.code,
                      }),
                    )
                  : await twoFactor.verifyTotp({ code: values.code })

                if (!result?.data || result.error) {
                  throw new Error(result.error?.message ?? "Invalid TOTP code")
                }

                if (IN_ELECTRON) {
                  const token = getAuthTokenFromResult(result)
                  if (token) {
                    setAuthSessionToken(token)
                    await setElectronSessionToken(token)
                  }
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
      if (IN_ELECTRON) {
        const token = getAuthTokenFromResult(res)
        if (token) {
          setAuthSessionToken(token)
          await setElectronSessionToken(token)
        }
      }
      handleSessionChanges()
    }
  }

  return (
    <Form {...form}>
      <form data-testid="login-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("login.email")}</FormLabel>
              <FormControl>
                <Input
                  data-testid="login-email-input"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  inputMode="email"
                  spellCheck={false}
                  {...field}
                />
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
                <Input
                  data-testid="login-password-input"
                  type="password"
                  autoCapitalize="none"
                  autoComplete={IN_ELECTRON ? "current-password" : "new-password"}
                  autoCorrect="off"
                  spellCheck={false}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col space-y-3">
          <Button
            data-testid="login-submit"
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

      <div className="pb-2 text-center text-sm text-text-secondary">
        <Trans
          t={t}
          i18nKey="login.no_account"
          components={{
            strong: (
              <button
                data-testid="login-switch-register"
                type="button"
                className="inline-flex cursor-pointer items-center gap-1 text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2"
                onClick={() => onLoginStateChange("register")}
              />
            ),
          }}
        />
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

    const result = IN_ELECTRON
      ? normalizeElectronAuthResult(
          await getElectronAuthService()?.signUpWithCredential?.({
            email: values.email,
            password: values.password,
            name: values.email.split("@")[0]!,
            callbackURL: "/",
            headers,
          }),
        )
      : await signUp.email(
          {
            email: values.email,
            password: values.password,
            name: values.email.split("@")[0]!,
            callbackURL: "/",
          },
          {
            onError(context) {
              toast.error(context.error.message)
            },
            headers,
          },
        )

    if (result?.error) {
      return result
    }

    if (IN_ELECTRON) {
      const token = getAuthTokenFromResult(result)
      if (token) {
        setAuthSessionToken(token)
        await setElectronSessionToken(token)
      }
    }

    handleSessionChanges()

    return result
  }

  return (
    <div className="relative">
      <Form {...form}>
        <form
          data-testid="register-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("register.email")}</FormLabel>
                <FormControl>
                  <Input
                    data-testid="register-email-input"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    inputMode="email"
                    spellCheck={false}
                    {...field}
                  />
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
                  <Input
                    data-testid="register-password-input"
                    type="password"
                    autoCapitalize="none"
                    autoComplete="new-password"
                    autoCorrect="off"
                    spellCheck={false}
                    {...field}
                  />
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
                  <Input
                    data-testid="register-confirm-password-input"
                    type="password"
                    autoCapitalize="none"
                    autoComplete="new-password"
                    autoCorrect="off"
                    spellCheck={false}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            data-testid="register-submit"
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

      <div className="pb-2 text-center text-sm text-text-secondary">
        <Trans
          t={t}
          i18nKey="login.have_account"
          components={{
            strong: (
              <button
                data-testid="register-switch-login"
                type="button"
                className="inline-flex cursor-pointer items-center gap-1 text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2"
                onClick={() => onLoginStateChange("login")}
              />
            ),
          }}
        />
      </div>
    </div>
  )
}
