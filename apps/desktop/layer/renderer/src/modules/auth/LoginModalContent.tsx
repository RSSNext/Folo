import { Spring } from "@follow/components/constants/spring.js"
import { useMobile } from "@follow/components/hooks/useMobile.js"
import { Folo } from "@follow/components/icons/folo.js"
import { Logo } from "@follow/components/icons/logo.js"
import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { Divider } from "@follow/components/ui/divider/Divider.js"
import { useIsDark } from "@follow/hooks"
import type { LoginRuntime } from "@follow/shared/auth"
import { stopPropagation } from "@follow/utils/dom"
import { cn } from "@follow/utils/utils"
import { m } from "motion/react"
import { useEffect, useState } from "react"
import { Trans, useTranslation } from "react-i18next"

import { useServerConfigs } from "~/atoms/server-configs"
import { useCurrentModal, useModalStack } from "~/components/ui/modal/stacked/hooks"
import { authClient, loginHandler } from "~/lib/auth"
import { useAuthProviders } from "~/queries/users"

import { LoginWithPassword, RegisterForm } from "./Form"
import { ReferralForm } from "./ReferralForm"
import { TokenModalContent } from "./TokenModal"

interface LoginModalContentProps {
  runtime: LoginRuntime
  canClose?: boolean
}

export const LoginModalContent = (props: LoginModalContentProps) => {
  const serverConfigs = useServerConfigs()

  const modal = useCurrentModal()
  const { present } = useModalStack()

  const { canClose = true, runtime } = props

  const { t } = useTranslation()
  const { data: authProviders, isLoading } = useAuthProviders()

  const isMobile = useMobile()

  const providers = Object.entries(authProviders || [])

  const [isRegister, setIsRegister] = useState(true)
  const [isEmail, setIsEmail] = useState(false)

  const handleOpenLegal = (type: "privacy" | "tos") => {
    const path = {
      privacy: "privacy-policy",
      tos: "terms-of-service",
    }

    window.open(`https://folo.is/${path[type]}`, "_blank")
  }

  const handleOpenToken = () => {
    present({
      id: "token",
      title: t("login.enter_token"),
      content: () => <TokenModalContent />,
    })
  }

  const isDark = useIsDark()

  const handleLoginStateChange = (state: "register" | "login") => {
    setIsRegister(state === "register")
  }

  const [lastMethod, setLastMethod] = useState<string | null>(null)
  useEffect(() => {
    let lastMethodValue = authClient.getLastUsedLoginMethod()
    if (lastMethodValue === "email") {
      lastMethodValue = "credential"
    }
    if (lastMethodValue) {
      setIsRegister(false)
      setLastMethod(lastMethodValue)
    }
  }, [lastMethod])

  const Inner = (
    <>
      {isEmail && (
        <div className="absolute left-8 top-6">
          <MotionButtonBase
            className="flex cursor-button items-center gap-2 text-center font-medium duration-200 hover:text-accent"
            onClick={() => setIsEmail(false)}
          >
            <i className="i-mgc-left-cute-fi" />
            {t("login.back")}
          </MotionButtonBase>
        </div>
      )}

      <div className="-mt-9 mb-4 flex items-center justify-center">
        <Logo className="size-16" />
      </div>
      <div className="mb-6 mt-4 flex items-center justify-center text-center">
        <span className="text-3xl">
          {isRegister ? t("signin.sign_up_to") : t("signin.sign_in_to")}
        </span>
        <Folo className="ml-2 size-14" />
      </div>

      {isEmail ? (
        isRegister ? (
          <RegisterForm onLoginStateChange={handleLoginStateChange} />
        ) : (
          <LoginWithPassword runtime={runtime} onLoginStateChange={handleLoginStateChange} />
        )
      ) : (
        <div className="mb-3 flex flex-col items-center justify-center gap-4">
          {isLoading
            ? // Skeleton loaders to prevent CLS
              Array.from({ length: 4 })
                .fill(0)
                .map((_, index) => (
                  <div
                    key={index}
                    className="relative h-12 w-full animate-pulse rounded-xl border border-material-medium bg-material-ultra-thick"
                  />
                ))
            : providers.map(([key, provider]) => (
                <MotionButtonBase
                  key={key}
                  onClick={() => {
                    if (key === "credential") {
                      setIsEmail(true)
                    } else {
                      loginHandler(key, "app")
                    }
                  }}
                  className="center relative w-full gap-2 rounded-xl border py-3 pl-5 font-semibold duration-200 hover:bg-material-medium"
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
                  {lastMethod === key && (
                    <div className="absolute -right-2 -top-2 rounded-xl bg-accent px-2 py-0.5 text-sm text-white">
                      {t("login.lastUsed")}
                    </div>
                  )}
                </MotionButtonBase>
              ))}

          {isRegister && serverConfigs?.REFERRAL_ENABLED && (
            <ReferralForm className="mb-4 w-full" />
          )}
          <div className="-mb-1.5 mt-1 text-center text-xs leading-4 text-text-secondary">
            <a onClick={() => handleOpenToken()} className="hover:underline">
              {t("login.enter_token")}
            </a>
          </div>
          <div className="text-center text-xs leading-4 text-text-secondary">
            <span>{t("login.agree_to")}</span>{" "}
            <a onClick={() => handleOpenLegal("tos")} className="text-accent hover:underline">
              {t("login.terms")}
            </a>{" "}
            &{" "}
            <a onClick={() => handleOpenLegal("privacy")} className="text-accent hover:underline">
              {t("login.privacy")}
            </a>
          </div>
        </div>
      )}

      {!isEmail && (
        <>
          <Divider className="mb-5 mt-4" />
          <div className="pb-2 text-center font-medium" onClick={() => setIsRegister(!isRegister)}>
            <Trans
              t={t}
              i18nKey={isRegister ? "login.have_account" : "login.no_account"}
              components={{
                strong: <span className="text-accent" />,
              }}
            />
          </div>
        </>
      )}
    </>
  )
  if (isMobile) {
    return Inner
  }

  return (
    <div className="center flex h-full" onClick={canClose ? modal.dismiss : undefined}>
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={Spring.presets.snappy}
      >
        <div
          onClick={stopPropagation}
          tabIndex={-1}
          className="relative w-[26rem] rounded-xl border bg-background p-3 px-8 shadow-2xl shadow-stone-300 dark:border-neutral-700 dark:shadow-stone-800"
        >
          {Inner}
        </div>
      </m.div>
    </div>
  )
}
