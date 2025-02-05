import { useMobile } from "@follow/components/hooks/useMobile.js"
import { Logo } from "@follow/components/icons/logo.js"
import { AutoResizeHeight } from "@follow/components/ui/auto-resize-height/index.js"
import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { authProvidersConfig } from "@follow/constants"
import type { LoginRuntime } from "@follow/shared/auth"
import { loginHandler } from "@follow/shared/auth"
import clsx from "clsx"
import { AnimatePresence, m } from "framer-motion"
import type { FC } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { useCurrentModal, useModalStack } from "~/components/ui/modal/stacked/hooks"
import type { AuthProvider } from "~/queries/users"
import { useAuthProviders } from "~/queries/users"

import { LoginWithPassword } from "./Form"

interface LoginModalContentProps {
  runtime: LoginRuntime
  canClose?: boolean
}

const defaultProviders = {
  google: {
    id: "google",
    name: "Google",
    color: "#3b82f6",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><path d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z"/><path fill="currentColor" d="M12 5.5a6.5 6.5 0 1 0 6.326 8H13a1.5 1.5 0 0 1 0-3h7a1.5 1.5 0 0 1 1.5 1.5a9.5 9.5 0 1 1-2.801-6.736a1.5 1.5 0 1 1-2.116 2.127A6.475 6.475 0 0 0 12 5.5Z"/></g></svg>',
  },
  github: {
    id: "github",
    name: "GitHub",
    color: "#000000",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><g fill="none"><path d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z"/><path fill="currentColor" d="M7.024 2.31a9.08 9.08 0 0 1 2.125 1.046A11.432 11.432 0 0 1 12 3c.993 0 1.951.124 2.849.355a9.08 9.08 0 0 1 2.124-1.045c.697-.237 1.69-.621 2.28.032c.4.444.5 1.188.571 1.756c.08.634.099 1.46-.111 2.28C20.516 7.415 21 8.652 21 10c0 2.042-1.106 3.815-2.743 5.043a9.456 9.456 0 0 1-2.59 1.356c.214.49.333 1.032.333 1.601v3a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-.991c-.955.117-1.756.013-2.437-.276c-.712-.302-1.208-.77-1.581-1.218c-.354-.424-.74-1.38-1.298-1.566a1 1 0 0 1 .632-1.898c.666.222 1.1.702 1.397 1.088c.48.62.87 1.43 1.63 1.753c.313.133.772.22 1.49.122L8 17.98a3.986 3.986 0 0 1 .333-1.581a9.455 9.455 0 0 1-2.59-1.356C4.106 13.815 3 12.043 3 10c0-1.346.483-2.582 1.284-3.618c-.21-.82-.192-1.648-.112-2.283l.005-.038c.073-.582.158-1.267.566-1.719c.59-.653 1.584-.268 2.28-.031Z"/></g></svg>',
  },
}

const overrideProviderIconMap = {
  apple: <i className="i-mgc-apple-cute-fi text-black dark:text-white" />,
  credential: <i className="i-mingcute-mail-line text-black dark:text-white" />,
}

export const LoginModalContent = (props: LoginModalContentProps) => {
  const modal = useCurrentModal()

  const { canClose = true, runtime } = props

  const { t } = useTranslation()
  const { data: authProviders } = useAuthProviders()

  const [loadingLockSet, _setLoadingLockSet] = useState<string>("")

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const setLoadingLockSet = (id: string) => {
    _setLoadingLockSet(id)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => {
      _setLoadingLockSet("")
    }, 3000)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const disabled = !!loadingLockSet

  const filteredDefaultProviders = useMemo(() => {
    if (!authProviders) return Object.values(defaultProviders)
    return Object.entries(defaultProviders)
      .filter(([key]) => authProviders[key])
      .map(([_, provider]) => provider)
  }, [authProviders])

  const extraProviders = useMemo(() => {
    if (!authProviders) return []
    return Object.entries(authProviders)
      .filter(([key]) => !defaultProviders[key])
      .map(([_, provider]) => provider)
  }, [authProviders])

  const isMobile = useMobile()

  const Inner = (
    <>
      <div className="-mt-8 mb-4 flex items-center justify-center md:-mt-8">
        <Logo className="size-12" />
      </div>
      <div className="-mt-0 text-center">
        <span className="text-xl">
          {t("signin.sign_in_to")} <b>{APP_NAME}</b>
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {filteredDefaultProviders.map((provider) => (
          <MotionButtonBase
            key={provider.id}
            className={clsx(
              "center h-[48px] rounded-[8px] font-sans text-base font-medium text-white lg:w-[320px]",
              disabled && "pointer-events-none opacity-50",
              "overflow-hidden",
              authProvidersConfig[provider.id]?.buttonClassName,
            )}
            disabled={disabled}
            onClick={() => {
              loginHandler(provider.id, runtime)
              setLoadingLockSet(provider.id)
              window.analytics?.capture("login", {
                type: provider.id,
              })
            }}
          >
            <LoginButtonContent isLoading={loadingLockSet === provider.id}>
              <i
                className={clsx("mr-2 text-xl", authProvidersConfig[provider.id]?.iconClassName)}
              />{" "}
              {t("signin.continue_with", { provider: provider.name })}
            </LoginButtonContent>
          </MotionButtonBase>
        ))}

        <AuthProvidersRender providers={extraProviders} runtime={runtime} />
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
        exit={{ opacity: 0, y: 10, transition: { type: "tween" } }}
        transition={{ type: "spring" }}
      >
        <div className="rounded-xl border bg-background p-3 px-8 shadow-2xl shadow-stone-300 dark:border-neutral-700 dark:shadow-stone-800">
          {Inner}
        </div>
      </m.div>
    </div>
  )
}

const LoginButtonContent = (props: { children: React.ReactNode; isLoading: boolean }) => {
  const { children, isLoading } = props
  return (
    <AnimatePresence mode="popLayout">
      {isLoading ? (
        <m.div
          animate={{
            y: 0,
            opacity: 1,
          }}
          initial={{
            y: -30,
            opacity: 0,
          }}
          transition={{
            type: "spring",
          }}
          key="loading"
          className="contents"
        >
          <LoadingCircle size={"medium"} />
        </m.div>
      ) : (
        <m.div
          key="text"
          className="center whitespace-nowrap"
          transition={{
            type: "spring",
          }}
          exit={{
            y: "-100%",
            opacity: 0,
          }}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  )
}

export const AuthProvidersRender: FC<{
  providers: AuthProvider[]
  runtime: LoginRuntime
}> = ({ providers, runtime }) => {
  const { t } = useTranslation()
  const [authProcessingLockSet, setAuthProcessingLockSet] = useState(() => new Set<string>())
  const { present } = useModalStack()
  return (
    <AutoResizeHeight spring>
      {providers.length > 0 && (
        <ul className="relative flex items-center justify-center gap-3 pt-4 before:absolute before:inset-x-28 before:top-0 before:h-px before:bg-stone-200 before:content-[''] before:dark:bg-neutral-700">
          {providers.map((provider) => (
            <li key={provider.id}>
              <MotionButtonBase
                disabled={authProcessingLockSet.has(provider.id)}
                onClick={() => {
                  if (authProcessingLockSet.has(provider.id)) return

                  if (provider.id === "credential") {
                    present({
                      content: () => <LoginWithPassword runtime={runtime} />,
                      title: t("login.with_email.title"),
                    })
                    return
                  }
                  loginHandler(provider.id, runtime)

                  setAuthProcessingLockSet((prev) => {
                    prev.add(provider.id)
                    return new Set(prev)
                  })
                }}
              >
                <div className="flex size-10 items-center justify-center rounded-full border bg-background dark:border-neutral-700">
                  {!authProcessingLockSet.has(provider.id) ? (
                    overrideProviderIconMap[provider.id] || (
                      <span
                        className="center inline-flex size-4"
                        style={{ color: provider.color }}
                        dangerouslySetInnerHTML={{ __html: provider.icon }}
                      />
                    )
                  ) : (
                    <div className="center flex">
                      <i className="i-mgc-loading-3-cute-re animate-spin opacity-50" />
                    </div>
                  )}
                </div>
              </MotionButtonBase>
            </li>
          ))}
        </ul>
      )}
    </AutoResizeHeight>
  )
}
