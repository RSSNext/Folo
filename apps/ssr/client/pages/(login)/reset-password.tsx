import { resetPassword } from "@client/lib/auth"
import { Button, MotionButtonBase } from "@follow/components/ui/button/index.jsx"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@follow/components/ui/card/index.jsx"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input } from "@follow/components/ui/input/index.js"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { z } from "zod"

const passwordSchema = z.string().min(8).max(128)
const initPasswordFormSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export function Component() {
  const { t } = useTranslation()
  const form = useForm<z.infer<typeof initPasswordFormSchema>>({
    resolver: zodResolver(initPasswordFormSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  })

  const { isValid } = form.formState

  const navigate = useNavigate()
  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof initPasswordFormSchema>) => {
      const token = new URLSearchParams(window.location.search).get("token")
      if (!token) {
        throw new Error("Token not found")
      }

      const res = await resetPassword({ newPassword: values.newPassword, token })
      const error = res.error?.message
      if (error) {
        throw new Error(error)
      }
    },
    onError: (error) => {
      toast.error(error.message)
    },
    onSuccess: () => {
      toast.success(t("login.reset_password.success"))
      navigate("/login")
    },
  })

  function onSubmit(values: z.infer<typeof initPasswordFormSchema>) {
    updateMutation.mutate(values)
  }

  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-[350px] max-w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MotionButtonBase
              onClick={() => {
                history.length > 1 ? history.back() : navigate("/login")
              }}
              className="-ml-1 inline-flex cursor-pointer items-center"
            >
              <i className="i-mingcute-left-line" />
            </MotionButtonBase>
            <span>{t("login.forget_password.label")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>{t("login.reset_password.description")}</CardDescription>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("login.new_password.label")}</FormLabel>
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
                    <FormLabel>{t("login.confirm_password.label")}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-right">
                <Button disabled={!isValid} type="submit" isLoading={updateMutation.isPending}>
                  {t("login.submit")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
