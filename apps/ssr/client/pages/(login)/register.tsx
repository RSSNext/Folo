import { signUp } from "@client/lib/auth"
import { Logo } from "@follow/components/icons/logo.jsx"
import { Button } from "@follow/components/ui/button/index.jsx"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input } from "@follow/components/ui/input/index.js"
import { env } from "@follow/shared/env.ssr"
import { tracker } from "@follow/tracker"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRef } from "react"
import ReCAPTCHA from "react-google-recaptcha"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"
import { z } from "zod"

export function Component() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-10">
      <Logo className="size-20" />
      <RegisterForm />
    </div>
  )
}

const formSchema = z
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
  const { t } = useTranslation()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const { isValid } = form.formState

  const navigate = useNavigate()

  const recaptchaRef = useRef<ReCAPTCHA>(null)

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const token = await recaptchaRef.current?.executeAsync()
    return signUp.email({
      email: values.email,
      password: values.password,
      name: values.email.split("@")[0]!,
      callbackURL: "/",
      fetchOptions: {
        onSuccess() {
          tracker.register({
            type: "email",
          })
          navigate("/login")
        },
        onError(context) {
          toast.error(context.error.message)
        },
        headers: {
          "x-token": `r2:${token}`,
        },
      },
    })
  }

  return (
    <div className="relative">
      <h1 className="center flex text-2xl font-bold">
        {t("register.label", { app_name: APP_NAME })}
      </h1>
      <div className="text-muted-foreground mt-2 text-center">
        <Trans
          i18nKey="register.note"
          components={{
            LoginLink: (
              <Link to="/login" className="text-accent hover:underline">
                {t("register.login")}
              </Link>
            ),
          }}
        />
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
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
          <ReCAPTCHA ref={recaptchaRef} sitekey={env.VITE_RECAPTCHA_V2_SITE_KEY} size="invisible" />
          <Button disabled={!isValid} type="submit" className="w-full" size="lg">
            {t("register.submit")}
          </Button>
        </form>
      </Form>
    </div>
  )
}
