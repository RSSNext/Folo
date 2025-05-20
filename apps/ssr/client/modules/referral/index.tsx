import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input } from "@follow/components/ui/input/Input.jsx"
import { getStorageNS } from "@follow/utils/ns"
import { cn } from "@follow/utils/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

const formSchema = z.object({
  referral: z.string().optional(),
})

function getDefaultReferralCode() {
  const urlParams = new URLSearchParams(window.location.search)
  const referralCodeFromUrl = urlParams.get("referral")

  if (referralCodeFromUrl) {
    localStorage.setItem(getStorageNS("referral"), referralCodeFromUrl)
  }

  const referralCodeFromLocalStorage = localStorage.getItem(getStorageNS("referral"))
  return referralCodeFromUrl || referralCodeFromLocalStorage || ""
}

export function ReferralForm({ className }: { className?: string }) {
  const { t } = useTranslation()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      referral: getDefaultReferralCode(),
    },
  })

  const { watch } = form
  useEffect(() => {
    const sub = watch((value) => {
      const referralCode = value.referral
      if (referralCode) {
        localStorage.setItem(getStorageNS("referral"), referralCode)
      }
    })
    return () => sub.unsubscribe()
  }, [watch])

  return (
    <Form {...form}>
      <form className={cn(className)}>
        <FormField
          control={form.control}
          name="referral"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("register.referral.label")}</FormLabel>
              <FormControl>
                <Input type="text" {...field} />
              </FormControl>
              <FormDescription>{t("register.referral.description")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
