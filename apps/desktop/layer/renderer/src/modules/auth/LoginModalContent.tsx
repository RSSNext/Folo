import { Spring } from "@follow/components/constants/spring.js"
import { useMobile } from "@follow/components/hooks/useMobile.js"
import { Folo } from "@follow/components/icons/folo.js"
import { Logo } from "@follow/components/icons/logo.js"
import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { useIsDark } from "@follow/hooks"
import type { LoginRuntime } from "@follow/shared/auth"
import { stopPropagation } from "@follow/utils/dom"
import { cn } from "@follow/utils/utils"
import { m } from "motion/react"
import { useEffect, useState } from "react"
import { Trans, useTranslation } from "react-i18next"

import { useServerConfigs } from "~/atoms/server-configs"
import { GlassButton } from "~/components/ui/button/GlassButton"
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
        <m.div
          className="absolute -left-3 top-0 z-30"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={Spring.presets.smooth}
        >
          <MotionButtonBase
            className="flex cursor-button items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium duration-200 hover:bg-fill-secondary"
            onClick={() => setIsEmail(false)}
          >
            <i className="i-mgc-left-cute-fi size-4" />
            <span>{t("login.back")}</span>
          </MotionButtonBase>
        </m.div>
      )}

      {/* Header Section */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <m.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={Spring.presets.smooth}
        >
          <Logo className="size-20" />
        </m.div>
        <m.div
          className="flex items-center gap-2"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={Spring.presets.smooth}
        >
          <span className="text-2xl font-semibold">
            {isRegister ? t("signin.sign_up_to") : t("signin.sign_in_to")}
          </span>
          <Folo className="size-12" />
        </m.div>
      </div>

      <GlassButton
        variant="flat"
        className="absolute -right-2 -top-2 bg-material-medium"
        onClick={modal.dismiss}
      >
        <i className="i-mgc-close-cute-re size-4" />
      </GlassButton>

      {isEmail ? (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={Spring.presets.smooth}
        >
          {isRegister ? (
            <RegisterForm onLoginStateChange={handleLoginStateChange} />
          ) : (
            <LoginWithPassword runtime={runtime} onLoginStateChange={handleLoginStateChange} />
          )}
        </m.div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Login Providers */}
          <div className="flex flex-col gap-3">
            {isLoading
              ? // Skeleton loaders to prevent CLS
                Array.from({ length: 4 })
                  .fill(0)
                  .map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="relative h-12 w-full animate-pulse rounded-xl border border-fill-secondary bg-material-medium"
                    />
                  ))
              : providers.map(([key, provider], index) => (
                  <m.div
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...Spring.presets.smooth, delay: index * 0.05 }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (key === "credential") {
                          setIsEmail(true)
                        } else {
                          loginHandler(key, "app")
                        }
                      }}
                      className="group center relative w-full gap-2 rounded-xl border border-border bg-material-medium py-3.5 pl-5 font-medium backdrop-blur-sm transition-all duration-200 hover:border-folo/30 hover:bg-folo/10"
                    >
                      <img
                        className={cn(
                          "absolute left-7 size-5 object-contain",
                          !provider.iconDark64 &&
                            "dark:brightness-[0.85] dark:hue-rotate-180 dark:invert",
                        )}
                        src={isDark ? provider.iconDark64 || provider.icon64 : provider.icon64}
                        alt={provider.name}
                      />
                      <span className="relative z-10">
                        {t("login.continueWith", { provider: provider.name })}
                      </span>

                      {lastMethod === key && (
                        <m.div
                          className="absolute -right-2 -top-2 z-20 rounded-lg bg-accent px-2.5 py-1 text-xs font-medium text-white"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={Spring.presets.bouncy}
                        >
                          {t("login.lastUsed")}
                        </m.div>
                      )}
                    </button>
                  </m.div>
                ))}
          </div>

          {/* Referral Form */}
          {isRegister && serverConfigs?.REFERRAL_ENABLED && (
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...Spring.presets.smooth, delay: 0.2 }}
            >
              <ReferralForm className="w-full" />
            </m.div>
          )}

          {/* Footer Links */}
          <div className="flex flex-col gap-3">
            <div className="text-center text-xs leading-relaxed text-text-tertiary">
              <button
                type="button"
                onClick={() => handleOpenToken()}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-fill-secondary hover:text-text-secondary"
              >
                <i className="i-mgc-key-2-cute-re size-3.5" />
                <span>{t("login.enter_token")}</span>
              </button>
            </div>
            <div className="text-center text-xs leading-relaxed text-text-tertiary">
              <span>{t("login.agree_to")} </span>
              <button
                type="button"
                onClick={() => handleOpenLegal("tos")}
                className="text-accent transition-colors hover:text-accent/80 hover:underline"
              >
                {t("login.terms")}
              </button>
              <span> & </span>
              <button
                type="button"
                onClick={() => handleOpenLegal("privacy")}
                className="text-accent transition-colors hover:text-accent/80 hover:underline"
              >
                {t("login.privacy")}
              </button>
            </div>
          </div>
        </div>
      )}

      {!isEmail && (
        <>
          {/* Gradient Divider */}
          <div
            className="my-6 h-px"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(255, 92, 0, 0.2), transparent)",
            }}
          />

          {/* Switch Account Type */}
          <m.button
            className="group w-full cursor-pointer pb-4 text-center text-sm font-medium transition-colors"
            onClick={() => setIsRegister(!isRegister)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Trans
              t={t}
              i18nKey={isRegister ? "login.have_account" : "login.no_account"}
              components={{
                strong: (
                  <span className="text-accent transition-colors group-hover:text-accent/80" />
                ),
              }}
            />
          </m.button>
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
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={Spring.presets.smooth}
      >
        <div
          onClick={stopPropagation}
          tabIndex={-1}
          className="relative w-[28rem] overflow-hidden rounded-2xl border border-folo/20 bg-background p-8 shadow-2xl shadow-folo/10 backdrop-blur-xl"
        >
          {/* Inner glow layer */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 0%, rgba(255, 92, 0, 0.08), transparent 60%)",
            }}
          />

          {/* Content */}
          <div className="relative">{Inner}</div>
        </div>
      </m.div>
    </div>
  )
}
