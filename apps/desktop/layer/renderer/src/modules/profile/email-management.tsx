import { useMobile } from "@follow/components/hooks/useMobile.js"
import { Button } from "@follow/components/ui/button/index.js"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@follow/components/ui/form/index.js"
import { Input } from "@follow/components/ui/input/Input.js"
import { Label } from "@follow/components/ui/label/index.js"
import { cn } from "@follow/utils/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { m } from "motion/react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import { setWhoami, useWhoami } from "~/atoms/user"
import { AnimatedCommandButton } from "~/components/ui/button/base"
import { CopyButton } from "~/components/ui/button/CopyButton"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { changeEmail, sendVerificationEmail } from "~/lib/auth"

const formSchema = z.object({
  email: z.string().email(),
})

export function EmailManagement() {
  const user = useWhoami()
  const isMobile = useMobile()
  const { t } = useTranslation("settings")

  const verifyEmailMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email) return
      return sendVerificationEmail({
        email: user.email,
      })
    },
    onSuccess: () => {
      toast.success(t("profile.email.verification_sent"))
    },
  })

  const { present } = useModalStack()
  return (
    <>
      <div className="mb-2 flex items-center space-x-1">
        <Label className="text-sm">{t("profile.email.label")}</Label>
        <span
          className={cn(
            "rounded-full border px-1 text-[10px] font-semibold",
            user?.emailVerified ? "border-green-500 text-green-500" : "border-red-500 text-red-500",
          )}
        >
          {user?.emailVerified ? t("profile.email.verified") : t("profile.email.unverified")}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-text-secondary group flex items-center gap-2">
          {user?.email}

          <AnimatedCommandButton
            icon={<m.i className="i-mgc-edit-cute-re size-4" />}
            className="size-5 p-1"
            variant="ghost"
            onClick={() => {
              present({
                title: t("profile.email.change"),
                content: EmailManagementForm,
              })
            }}
          />
          {user?.email && (
            <CopyButton
              value={user.email}
              className={cn(
                "size-5 p-1 duration-300",
                !isMobile && "opacity-0 group-hover:opacity-100",
              )}
            />
          )}
        </div>
        {!user?.emailVerified && (
          <Button
            variant="outline"
            type="button"
            isLoading={verifyEmailMutation.isPending}
            onClick={() => {
              verifyEmailMutation.mutate()
            }}
            buttonClassName="mt-2"
          >
            {t("profile.email.send_verification")}
          </Button>
        )}
      </div>
    </>
  )
}
function EmailManagementForm() {
  const { t } = useTranslation("settings")
  const user = useWhoami()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: user?.email || "",
    },
  })

  const updateEmailMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const res = await changeEmail({ newEmail: values.email })
      if (res.error) {
        throw new Error(res.error.message)
      }
    },
    onSuccess: (_, variables) => {
      if (user?.emailVerified) {
        toast.success(t("profile.email.changed_verification_sent"))
      } else {
        if (user) {
          setWhoami({
            ...user,
            email: variables.email,
          })
        }
        form.reset({ email: variables.email })
        toast.success(t("profile.email.changed"))
      }
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          updateEmailMutation.mutate(values)
        })}
        className="w-[30ch] max-w-full space-y-4"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-center gap-x-2">
                  <Input autoFocus {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-x-2 text-right">
          <Button
            type="submit"
            isLoading={updateEmailMutation.isPending}
            disabled={updateEmailMutation.isPending || !form.formState.isDirty}
          >
            {t("profile.email.change")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
