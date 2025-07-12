// sync this file with apps/ssr/client/modules/referral/index.tsx
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
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { apiClient } from "~/lib/api-fetch"

const formSchema = z.object({
  referral: z.string().optional(),
})

function getDefaultReferralCode() {
  const urlParams = new URLSearchParams(window.location.search)
  const referralCodeFromUrl = urlParams.get("referral")

  if (referralCodeFromUrl) {
    localStorage.setItem(getStorageNS("referral-code"), referralCodeFromUrl)
  }

  const referralCodeFromLocalStorage = localStorage.getItem(getStorageNS("referral-code"))
  return referralCodeFromUrl || referralCodeFromLocalStorage || ""
}

async function getReferralCycleDays(code: string) {
  return apiClient.referrals.days.$get({ query: { code } })
}

export function ReferralForm({
  className,
  align = "center",
}: {
  className?: string
  align?: "left" | "center"
}) {
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
        localStorage.setItem(getStorageNS("referral-code"), referralCode)
      }
    })
    return () => sub.unsubscribe()
  }, [watch])

  const referral = watch("referral")

  const { data } = useQuery({
    queryKey: ["referral", "days", referral],
    queryFn: () => getReferralCycleDays(referral || ""),
    enabled: !!referral,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
  const days = data?.data.referralCycleDays || 0

  return (
    <Form {...form}>
      <form className={cn(align === "left" ? "text-left" : "text-center", className)}>
        <FormField
          control={form.control}
          name="referral"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("register.referral.label")}</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  className={cn(align === "left" ? "text-left" : "text-center")}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {days || !referral
                  ? days
                    ? t("register.referral.days", {
                        days,
                      })
                    : t("register.referral.description")
                  : t("register.referral.invalid")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
