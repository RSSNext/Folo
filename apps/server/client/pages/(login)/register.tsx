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
import { signUp } from "@follow/shared/auth"
import { zodResolver } from "@hookform/resolvers/zod"
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
  const { t } = useTranslation("external")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const navigate = useNavigate()

  function onSubmit(values: z.infer<typeof formSchema>) {
    return signUp.email({
      email: values.email,
      password: values.password,
      name: values.email.split("@")[0],
      callbackURL: "/",
      fetchOptions: {
        onSuccess() {
          navigate("/login")
        },
        onError(context) {
          toast.error(context.error.message)
        },
      },
    })
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">{t("register.label", { app_name: APP_NAME })}</h1>
      <p className="text-center text-muted-foreground">
        <Trans
          ns="external"
          i18nKey="register.note"
          components={{
            LoginLink: (
              <Link to="/login" className="text-primary hover:underline">
                {t("register.login")}
              </Link>
            ),
          }}
        />
      </p>
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
          <Button type="submit" className="w-full" variant="outline">
            {t("register.submit")}
          </Button>
        </form>
      </Form>
    </div>
  )
}
