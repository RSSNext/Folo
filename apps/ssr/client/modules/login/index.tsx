import { UserAvatar } from "@client/components/ui/user-avatar"
import { loginHandler, oneTimeToken, signOut, twoFactor } from "@client/lib/auth"
import { openInFollowApp } from "@client/lib/helper"
import { queryClient } from "@client/lib/query-client"
import { useSession } from "@client/query/auth"
import { useAuthProviders } from "@client/query/users"
import { Logo } from "@follow/components/icons/logo.jsx"
import { Button, MotionButtonBase } from "@follow/components/ui/button/index.js"
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
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { useIsDark } from "@follow/hooks"
import { env } from "@follow/shared/env.ssr"
import { cn } from "@follow/utils/utils"
import HCaptcha from "@hcaptcha/react-hcaptcha"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { Link, useLocation, useNavigate } from "react-router"
import { toast } from "sonner"
import { z } from "zod"

export function Login() {
  const { status, refetch } = useSession()

  const [redirecting, setRedirecting] = useState(false)

  const { data: authProviders, isLoading } = useAuthProviders()

  const location = useLocation()
  const urlParams = new URLSearchParams(location.search)
  const provider = urlParams.get("provider")
  const isCredentialProvider = provider === "credential"

  const isAuthenticated = status === "authenticated"

  const { t } = useTranslation()

  useEffect(() => {
    if (provider && !isCredentialProvider && status === "unauthenticated") {
      loginHandler(provider, "app")
      setRedirecting(true)
    }
  }, [isCredentialProvider, provider, status])

  const getCallbackUrl = useCallback(async () => {
    const { data } = await oneTimeToken.generate()
    if (!data) return null
    return {
      url: `auth?token=${data.token}`,
    }
  }, [])

  const [openFailed, setOpenFailed] = useState(false)
  const [callbackUrl, setCallbackUrl] = useState<string>()
  const handleOpenApp = useCallback(async () => {
    const callbackUrl = await getCallbackUrl()
    if (!callbackUrl) return
    setCallbackUrl(callbackUrl.url)
    openInFollowApp({
      deeplink: callbackUrl.url,
      fallback: () => {
        setOpenFailed(true)
      },
    })
  }, [getCallbackUrl])

  const onceRef = useRef(false)
  useEffect(() => {
    if (isAuthenticated && !onceRef.current) {
      handleOpenApp()
    }
    onceRef.current = true
  }, [handleOpenApp, isAuthenticated])

  const navigate = useNavigate()

  const [isEmail, setIsEmail] = useState(false)
  const isDark = useIsDark()

  const LoginOrStatusContent = useMemo(() => {
    switch (true) {
      case isAuthenticated: {
        return (
          <div className="mt-4 flex w-full flex-col items-center justify-center px-4">
            <div className="relative flex items-center justify-center gap-10">
              <UserAvatar className="gap-4 px-10 py-4 text-2xl" />
              <div className="absolute right-0">
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await signOut()
                    await refetch()
                  }}
                >
                  <i className="i-mingcute-exit-line text-xl" />
                </Button>
              </div>
            </div>
            <p className="mt-4 text-center">
              {t("redirect.successMessage", { app_name: APP_NAME })}
            </p>
            <p className="text-text-secondary mt-2 text-center text-sm">
              {t("redirect.instruction", { app_name: APP_NAME })}
            </p>
            <div className="center mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                variant="text"
                buttonClassName="h-14 text-base px-10 rounded-full"
                onClick={() => {
                  window.location.href = "/"
                }}
              >
                {t("redirect.continueInBrowser")}
              </Button>

              <Button
                variant="primary"
                buttonClassName="h-12 !rounded-full px-10 text-lg"
                onClick={handleOpenApp}
              >
                {t("redirect.openApp", { app_name: APP_NAME })}
              </Button>
            </div>
            {openFailed && callbackUrl && (
              <div className="text-text mt-8 w-[31rem] space-y-2 text-center text-sm">
                <p>{t("login.enter_token")}</p>
                <p className="bg-fill-tertiary flex items-center justify-center gap-4 rounded-lg p-3">
                  <span className="blur-sm hover:blur-none">{callbackUrl}</span>
                  <i
                    className="i-mgc-copy-2-cute-re size-4 cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(callbackUrl)
                    }}
                  />
                </p>
              </div>
            )}
          </div>
        )
      }
      default: {
        return (
          <>
            {isEmail ? (
              <LoginWithPassword />
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
                      className={cn(
                        "absolute left-9 h-5",
                        !provider.iconDark64 &&
                          "dark:brightness-[0.85] dark:hue-rotate-180 dark:invert",
                      )}
                      src={isDark ? provider.iconDark64 || provider.icon64 : provider.icon64}
                    />
                    <span>{t("login.continueWith", { provider: provider.name })}</span>
                  </MotionButtonBase>
                ))}
              </div>
            )}
            <Divider />
            {isEmail ? (
              <div className="cursor-pointer pb-2 text-center" onClick={() => setIsEmail(false)}>
                Back
              </div>
            ) : (
              <div
                className="cursor-pointer pb-2 text-center"
                onClick={() => {
                  navigate("/register")
                }}
              >
                <Trans
                  t={t}
                  i18nKey="login.no_account"
                  components={{
                    strong: <span className="text-accent" />,
                  }}
                />
              </div>
            )}
          </>
        )
      }
    }
  }, [
    authProviders,
    handleOpenApp,
    isAuthenticated,
    refetch,
    t,
    isEmail,
    navigate,
    openFailed,
    callbackUrl,
    isDark,
  ])
  const Content = useMemo(() => {
    switch (true) {
      case redirecting: {
        return <div className="center">{t("login.redirecting")}</div>
      }
      default: {
        return <div className="flex min-w-80 flex-col gap-3">{LoginOrStatusContent}</div>
      }
    }
  }, [LoginOrStatusContent, redirecting, t])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <Logo className="size-16" />

      {!isAuthenticated && !isLoading && (
        <h1 className="mb-6 mt-8 text-2xl">
          {t("login.logInTo")} <b>{` ${APP_NAME}`}</b>
        </h1>
      )}
      {Content}
      {isLoading && <LoadingCircle className="mt-8" size="large" />}
    </div>
  )
}

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  code: z.string().length(6).regex(/^\d+$/).optional(),
})

function LoginWithPassword() {
  const { t } = useTranslation()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })
  const [needTwoFactor, setNeedTwoFactor] = useState(false)
  const [isButtonLoading, setIsButtonLoading] = useState(false)

  const captchaRef = useRef<HCaptcha>(null)

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsButtonLoading(true)
    try {
      if (needTwoFactor && values.code) {
        const res = await twoFactor.verifyTotp({ code: values.code })
        if (res?.error) {
          toast.error(res.error.message)
          setIsButtonLoading(false)
        } else {
          queryClient.invalidateQueries({ queryKey: ["auth", "session"] })
        }
        return
      }

      const response = await captchaRef.current?.execute({ async: true })
      if (!response?.response) {
        setIsButtonLoading(false)
        return
      }

      const res = await loginHandler("credential", "app", {
        ...values,
        headers: {
          "x-token": `hc:${response?.response}`,
        },
      })

      if (res?.error) {
        toast.error(res.error.message)
        setIsButtonLoading(false)
        return
      }

      if ((res?.data as any)?.twoFactorRedirect) {
        setNeedTwoFactor(true)
        form.setValue("code", "")
        setTimeout(() => form.setFocus("code"), 0)
        setIsButtonLoading(false)
        return
      } else {
        queryClient.invalidateQueries({ queryKey: ["auth", "session"] })
      }
    } catch (error) {
      console.error("Login error:", error)
      toast.error(t("login.errors.unknown"))
      setIsButtonLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-1">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("login.email")}</FormLabel>
              <FormControl>
                <Input type="email" {...field} disabled={isButtonLoading || needTwoFactor} />
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
              <FormLabel className="flex items-center justify-between">
                {t("login.password")}
                <Link
                  to="/forget-password"
                  className="text-accent block py-1 text-xs hover:underline"
                >
                  {t("login.forget_password.note")}
                </Link>
              </FormLabel>
              <FormControl>
                <Input type="password" {...field} disabled={isButtonLoading || needTwoFactor} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {needTwoFactor && (
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("login.two_factor.code")}</FormLabel>
                <FormControl>
                  <Input type="text" {...field} disabled={isButtonLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <HCaptcha ref={captchaRef} sitekey={env.VITE_HCAPTCHA_SITE_KEY} size="invisible" />
        <Button
          type="submit"
          buttonClassName="!mt-3 w-full"
          isLoading={isButtonLoading}
          size="lg"
          disabled={isButtonLoading}
        >
          {needTwoFactor
            ? t("login.two_factor.verify")
            : t("login.continueWith", { provider: t("words.email") })}
        </Button>
      </form>
    </Form>
  )
}
