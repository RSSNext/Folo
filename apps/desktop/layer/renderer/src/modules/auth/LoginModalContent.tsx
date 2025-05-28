import { Spring } from "@follow/components/constants/spring.js"
import { useMobile } from "@follow/components/hooks/useMobile.js"
import { Folo } from "@follow/components/icons/folo.js"
import { Logo } from "@follow/components/icons/logo.js"
import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { Divider } from "@follow/components/ui/divider/Divider.js"
import type { LoginRuntime } from "@follow/shared/auth"
import { stopPropagation } from "@follow/utils/dom"
import { m } from "motion/react"
import { useState } from "react"
import { Trans, useTranslation } from "react-i18next"

import { useCurrentModal, useModalStack } from "~/components/ui/modal/stacked/hooks"
import { loginHandler } from "~/lib/auth"
import { useAuthProviders } from "~/queries/users"

import { LoginWithPassword, RegisterForm } from "./Form"
import { LegalModalContent } from "./LegalModal"

interface LoginModalContentProps {
  runtime: LoginRuntime
  canClose?: boolean
}

export const LoginModalContent = (props: LoginModalContentProps) => {
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
    present({
      id: `legal-${type}`,
      title: type === "privacy" ? t("login.privacy") : t("login.terms"),
      content: () => <LegalModalContent type={type} />,
      resizeable: true,
      clickOutsideToDismiss: true,
      max: true,
    })
  }

  const Inner = (
    <>
      <div className="-mt-9 mb-4 flex items-center justify-center">
        <Logo className="size-16" />
      </div>
      <div className="mb-6 mt-4 flex items-center justify-center text-center">
        <span className="text-3xl">
          {isRegister ? t("signin.sign_up_to") : t("signin.sign_in_to")}
        </span>
        <Folo className="ml-2 size-14" />
      </div>

      {/* {isRegister ? <RegisterForm /> : <LoginWithPassword runtime={runtime} />} */}
      {/* {providers.length > 0 && (
        <div className="my-3 w-full space-y-2">
          <div className="flex items-center justify-center">
            <Divider className="flex-1" />
            <p className="text-text-tertiary px-4 text-center text-sm">{t("login.or")}</p>
            <Divider className="flex-1" />
          </div>
        </div>
      )} */}
      {isEmail ? (
        isRegister ? (
          <RegisterForm />
        ) : (
          <LoginWithPassword runtime={runtime} />
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
                    className="bg-material-ultra-thick border-material-medium relative h-12 w-full animate-pulse rounded-xl border"
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
                  className="center hover:bg-material-medium relative w-full gap-2 rounded-xl border py-3 pl-5 font-semibold duration-200"
                >
                  <img
                    className="absolute left-9 h-5 dark:brightness-[0.85] dark:hue-rotate-180 dark:invert"
                    src={provider.icon64}
                  />
                  <span>{t("login.continueWith", { provider: provider.name })}</span>
                </MotionButtonBase>
              ))}
        </div>
      )}
      <Divider className="mb-5 mt-6" />
      {isEmail ? (
        <div className="flex items-center justify-center pb-2">
          <MotionButtonBase
            className="cursor-button hover:text-accent flex items-center gap-2 text-center font-medium duration-200"
            onClick={() => setIsEmail(false)}
          >
            <i className="i-mgc-left-cute-fi" />
            {t("login.back")}
          </MotionButtonBase>
        </div>
      ) : (
        <div className="pb-2 text-center font-medium" onClick={() => setIsRegister(!isRegister)}>
          <Trans
            t={t}
            i18nKey={isRegister ? "login.have_account" : "login.no_account"}
            components={{
              strong: <span className="text-accent" />,
            }}
          />
        </div>
      )}

      <div className="text-text-secondary mt-3 text-center text-xs leading-5">
        <span>{t("login.agree_to")}</span> <br />
        <a
          onClick={() => handleOpenLegal("tos")}
          className="text-accent cursor-pointer hover:underline"
        >
          {t("login.terms")}
        </a>{" "}
        &{" "}
        <a
          onClick={() => handleOpenLegal("privacy")}
          className="text-accent cursor-pointer hover:underline"
        >
          {t("login.privacy")}
        </a>
      </div>
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
          className="bg-background w-[25rem] rounded-xl border p-3 px-8 shadow-2xl shadow-stone-300 dark:border-neutral-700 dark:shadow-stone-800"
        >
          {Inner}
        </div>
      </m.div>
    </div>
  )
}
