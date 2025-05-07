import { Button } from "@follow/components/ui/button/index.js"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input } from "@follow/components/ui/input/index.js"
import { cn } from "@follow/utils/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { m } from "motion/react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { LazyDotLottie } from "~/components/common/LazyDotLottie"
import type { ModalActionsInternal } from "~/components/ui/modal"
import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"
import { getFetchErrorMessage } from "~/lib/error-parser"
import confettiUrl from "~/lottie/confetti.lottie?url"
import { auth } from "~/queries/auth"
import { useInvitationMutation } from "~/queries/invitations"

const formSchema = z.object({
  code: z.string().min(1),
})
const absoluteConfettiUrl = new URL(confettiUrl, import.meta.url).href
export const ActivationModalContent = ({
  className,
  hideDescription,
}: {
  className?: string
  hideDescription?: boolean
} & Partial<ModalActionsInternal>) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })
  const { setClickOutSideToDismiss } = useCurrentModal()
  const invitationMutation = useInvitationMutation({
    onError(error) {
      const message = getFetchErrorMessage(error)
      form.setError("code", { message })
    },
  })

  const { t } = useTranslation()

  function onSubmit(values: z.infer<typeof formSchema>) {
    invitationMutation.mutate(values.code)
  }

  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (invitationMutation.isSuccess) {
      setShowConfetti(true)
      setClickOutSideToDismiss(true)
      auth.getSession().invalidate()
    }
  }, [invitationMutation.isSuccess, setClickOutSideToDismiss])

  useEffect(() => {
    const timer = setTimeout(() => {
      form.setFocus("code", { shouldSelect: true })
    }, 300)
    return () => clearTimeout(timer)
  }, [])
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("w-[512px] max-w-full overflow-hidden px-0.5", className)}
      >
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem className="flex flex-col items-center gap-2 md:block">
              {!hideDescription && (
                <FormLabel className="!text-text">{t("activation.description")}</FormLabel>
              )}
              <FormControl>
                <Input
                  className="mt-1 dark:text-zinc-200"
                  placeholder={t("activation.title")}
                  {...field}
                />
              </FormControl>
              <div className="h-6">
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <div className="center relative flex">
          {showConfetti && (
            <LazyDotLottie
              className="absolute z-[1] size-[120px]"
              src={absoluteConfettiUrl}
              loop={false}
              autoplay
            />
          )}
          <Button
            variant={showConfetti ? "outline" : "primary"}
            type="submit"
            disabled={!form.formState.isValid}
            isLoading={invitationMutation.isPending}
          >
            {showConfetti && (
              <m.i
                initial={{ y: 5 }}
                animate={{
                  y: 0,
                }}
                className="i-mgc-check-circle-filled mr-2 text-green-500"
              />
            )}
            {t("activation.activate")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
