import { Avatar, AvatarFallback, AvatarImage } from "@follow/components/ui/avatar/index.jsx"
import { Button } from "@follow/components/ui/button/index.js"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input } from "@follow/components/ui/input/index.js"
import { cn } from "@follow/utils/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import { setWhoami, useWhoami } from "~/atoms/user"
import { updateUser } from "~/lib/auth"
import { toastFetchError } from "~/lib/error-parser"

const formSchema = z.object({
  handle: z.string().max(50).optional(),
  name: z.string().min(3).max(50),
  image: z.string().url().or(z.literal("")).optional(),
})

export const ProfileSettingForm = ({
  className,
  buttonClassName,
}: {
  className?: string
  buttonClassName?: string
}) => {
  const { t } = useTranslation("settings")
  const user = useWhoami()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      handle: user?.handle || undefined,
      name: user?.name || "",
      image: user?.image || "",
    },
  })

  const updateMutation = useMutation({
    mutationFn: (values: z.infer<typeof formSchema>) =>
      updateUser({
        handle: values.handle,
        image: values.image,
        name: values.name,
      }),
    onError: (error) => {
      toastFetchError(error)
    },
    onSuccess: (_, variables) => {
      if (user && variables) {
        setWhoami({ ...user, ...variables })
      }
      toast(t("profile.updateSuccess"), {
        duration: 3000,
      })
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateMutation.mutate(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn("mt-4 space-y-4", className)}>
        <FormField
          control={form.control}
          name="handle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("profile.handle.label")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>{t("profile.handle.description")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("profile.name.label")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>{t("profile.name.description")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <div className="flex gap-4">
              <FormItem className="w-full">
                <FormLabel>{t("profile.avatar.label")}</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-4">
                    <Input {...field} />
                    {field.value && (
                      <Avatar className="size-9">
                        <AvatarImage src={field.value} />
                        <AvatarFallback>{user?.name[0] || ""}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>
          )}
        />

        <div className={cn("text-right", buttonClassName)}>
          <Button type="submit" isLoading={updateMutation.isPending}>
            {t("profile.submit")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
