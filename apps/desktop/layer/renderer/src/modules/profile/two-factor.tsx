import { Button } from "@follow/components/ui/button/index.js"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input, InputOTP, InputOTPGroup, InputOTPSlot } from "@follow/components/ui/input/index.js"
import { Label } from "@follow/components/ui/label/index.js"
import { useWhoami } from "@follow/store/user/hooks"
import { userActions } from "@follow/store/user/store"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { m, useAnimation } from "motion/react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import QRCode from "react-qr-code"
import { toast } from "sonner"
import { z } from "zod"

import { useCurrentModal, useModalStack } from "~/components/ui/modal/stacked/hooks"
import { twoFactor } from "~/lib/auth"
import { getFetchErrorInfo } from "~/lib/error-parser"
import { useHasPassword } from "~/queries/auth"

import { NoPasswordHint } from "./update-password-form"

const passwordSchema = z.string().min(8).max(128)
const totpCodeSchema = z.string().length(6).regex(/^\d+$/)

const passwordFormSchema = z.object({
  password: passwordSchema,
})
type PasswordFormValues = z.infer<typeof passwordFormSchema>

const totpFormSchema = z.object({
  code: totpCodeSchema,
})
type TOTPFormValues = z.infer<typeof totpFormSchema>

type PasswordFormProps<V> = {
  onSubmitMutationFn: (values: V) => Promise<void>
  message?: {
    placeholder?: string
    label?: string
  }
  onSuccess?: () => void
}

const shakeVariants = {
  shake: {
    x: [0, -2, 2, -2, 2, 0],
    transition: {
      duration: 0.5,
    },
  },
  reset: {
    x: 0,
  },
}

export function TOTPForm({
  message,
  onSubmitMutationFn,
  onSuccess,
}: PasswordFormProps<TOTPFormValues>) {
  const { t } = useTranslation("settings")
  const controls = useAnimation()

  const form = useForm<TOTPFormValues>({
    resolver: zodResolver(totpFormSchema),
    defaultValues: { code: "" },
  })

  const updateMutation = useMutation({
    mutationFn: onSubmitMutationFn,
    onError: (error) => {
      const { code } = getFetchErrorInfo(error)
      if (error.message === "invalid two factor authentication" || code === 4007) {
        form.resetField("code")
        form.setError("code", {
          type: "manual",
          message: t("profile.totp_code.invalid"),
        })
        // Avoid calling setFocus right after reset as all input references will be removed by reset API.
        setTimeout(() => {
          form.setFocus("code")
        }, 10)
        controls.start("shake")
      }
    },
    onSuccess,
  })

  function onSubmit(values: TOTPFormValues) {
    updateMutation.mutate(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-[35ch] max-w-full space-y-4">
        <FormField
          control={form.control}
          name={"code"}
          render={({ field }) => (
            <FormItem className="flex flex-col items-center">
              <FormLabel className="shrink-0">
                {message?.label ?? t("profile.totp_code.label")}
              </FormLabel>
              <FormControl>
                <m.div variants={shakeVariants} animate={controls} className="flex justify-center">
                  <InputOTP
                    disabled={updateMutation.isPending}
                    autoFocus
                    className="!w-full"
                    maxLength={6}
                    onComplete={() => form.handleSubmit(onSubmit)()}
                    {...field}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </m.div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

export function PasswordForm({
  message,
  onSubmitMutationFn,
  onSuccess,
}: PasswordFormProps<PasswordFormValues>) {
  const { data: hasPassword, isLoading } = useHasPassword()
  const { t } = useTranslation("settings")

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { password: "" },
  })

  const updateMutation = useMutation({
    mutationFn: onSubmitMutationFn,
    onError: (error) => {
      toast.error(error.message)
    },
    onSuccess,
  })

  function onSubmit(values: PasswordFormValues) {
    updateMutation.mutate(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-[35ch] max-w-full space-y-4">
        <FormField
          control={form.control}
          name={"password"}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="shrink-0">
                {message?.label ?? t("profile.current_password.label")}
              </FormLabel>
              <FormControl>
                <Input
                  disabled={updateMutation.isPending}
                  autoFocus
                  type="password"
                  placeholder={message?.placeholder ?? t("profile.current_password.label")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!hasPassword && !isLoading && <NoPasswordHint i18nKey="profile.two_factor.no_password" />}

        <div className="text-right">
          <Button type="submit" isLoading={updateMutation.isPending}>
            {t("profile.submit")}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export const TwoFactorForm = () => {
  const { t } = useTranslation("settings")
  const modal = useCurrentModal()
  const user = useWhoami()
  const [totpURI, setTotpURI] = useState("")
  return totpURI ? (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center">
        <QRCode value={totpURI} className="dark:border dark:border-white" />
      </div>
      <TOTPForm
        message={{
          label: t("profile.totp_code.init"),
        }}
        onSubmitMutationFn={async (values) => {
          const res = await twoFactor.verifyTotp({ code: values.code })
          if (res.error) {
            throw new Error(res.error.message)
          }
          toast.success(t("profile.two_factor.enabled"))
          modal.dismiss()
          userActions.updateWhoami({ twoFactorEnabled: true })
        }}
      />
    </div>
  ) : (
    <PasswordForm
      onSubmitMutationFn={async (values) => {
        const res = user?.twoFactorEnabled
          ? await twoFactor.disable({ password: values.password })
          : await twoFactor.enable({ password: values.password })
        if (res.error) {
          throw new Error(res.error.message)
        }
        if ("totpURI" in res.data) {
          setTotpURI(res.data?.totpURI ?? "")
        } else {
          toast.success(t("profile.two_factor.disabled"))
          modal.dismiss()
          userActions.updateWhoami({ twoFactorEnabled: false })
        }
      }}
    />
  )
}

export function TwoFactor() {
  const { t } = useTranslation("settings")
  const { present } = useModalStack()
  const user = useWhoami()
  const actionTitle = user?.twoFactorEnabled
    ? t("profile.two_factor.disable")
    : t("profile.two_factor.enable")

  const { data: hasPassword, isLoading } = useHasPassword()

  return (
    <div className="flex items-center justify-between">
      <Label>{t("profile.two_factor.label")}</Label>
      {isLoading ? null : hasPassword ? (
        <Button
          variant="outline"
          onClick={() => {
            present({
              title: actionTitle,
              content: TwoFactorForm,
            })
          }}
        >
          {actionTitle}
        </Button>
      ) : (
        <NoPasswordHint i18nKey="profile.two_factor.no_password" />
      )}
    </div>
  )
}
