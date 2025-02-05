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
import type { LoginRuntime } from "@follow/shared/auth"
import { loginHandler, signUp, twoFactor } from "@follow/shared/auth"
import { env } from "@follow/shared/env"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import { useCurrentModal, useModalStack } from "~/components/ui/modal/stacked/hooks"

import { TOTPForm } from "../profile/two-factor"

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().max(128),
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
  const { isValid } = form.formState

  const { present } = useModalStack()
  const { dismiss } = useCurrentModal()

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const res = await loginHandler("credential", runtime, {
      email: values.email,
      password: values.password,
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
              <FormLabel>{t("login.password")}</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <a
          href={`${env.VITE_WEB_URL}/forget-password`}
          target="_blank"
          rel="noreferrer"
          className="block py-1 text-xs text-accent hover:underline"
        >
          {t("login.forget_password.note")}
        </a>
        <Button
          type="submit"
          buttonClassName="text-base !mt-3 w-full"
          disabled={!isValid}
          isLoading={form.formState.isSubmitting}
        >
          {t("login.continueWith", { provider: t("words.email") })}
        </Button>
        <Button
          buttonClassName="!mt-3 text-base"
          className="w-full"
          variant="outline"
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

  function onSubmit(values: z.infer<typeof registerFormSchema>) {
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
          <Button disabled={!isValid} type="submit" className="w-full">
            {t("register.submit")}
          </Button>
        </form>
      </Form>
    </div>
  )
}
