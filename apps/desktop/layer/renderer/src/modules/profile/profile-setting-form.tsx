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
import { Input, TextArea } from "@follow/components/ui/input/index.js"
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

const socialLinksSchema = z.object({
  twitter: z.string().max(64).optional(),
  github: z.string().max(64).optional(),
  instagram: z.string().max(64).optional(),
  facebook: z.string().max(64).optional(),
  youtube: z.string().max(64).optional(),
  discord: z.string().max(64).optional(),
})

const formSchema = z.object({
  handle: z.string().max(50).optional(),
  name: z.string().min(3).max(50),
  image: z.string().url().or(z.literal("")).optional(),
  bio: z.string().max(256).optional(),
  website: z.string().url().max(64).optional().or(z.literal("")),
  socialLinks: socialLinksSchema.optional(),
})

const socialIconClassNames = {
  twitter: "i-mgc-twitter-cute-fi",
  github: "i-mgc-github-cute-fi",
  instagram: "i-mingcute-ins-fill",
  facebook: "i-mingcute-facebook-fill",
  youtube: "i-mgc-youtube-cute-fi",
  discord: "i-mingcute-discord-fill",
}

const formItemLabelClassName = tw`pl-3`
// Extended user type to include the new fields
type ExtendedUser = ReturnType<typeof useWhoami> & {
  bio?: string
  website?: string
  socialLinks?: {
    twitter?: string
    github?: string
    instagram?: string
    facebook?: string
    youtube?: string
    discord?: string
  }
}

const socialCopyMap = {
  twitter: "Twitter",
  github: "GitHub",
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  discord: "Discord",
}

export const ProfileSettingForm = ({
  className,
  buttonClassName,
}: {
  className?: string
  buttonClassName?: string
}) => {
  const { t } = useTranslation("settings")
  const user = useWhoami() as ExtendedUser

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      handle: user?.handle || undefined,
      name: user?.name || "",
      image: user?.image || "",
      bio: user?.bio || "",
      website: user?.website || "",
      socialLinks: {
        twitter: user?.socialLinks?.twitter || "",
        github: user?.socialLinks?.github || "",
        instagram: user?.socialLinks?.instagram || "",
        facebook: user?.socialLinks?.facebook || "",
        youtube: user?.socialLinks?.youtube || "",
        discord: user?.socialLinks?.discord || "",
      },
    },
  })

  const updateMutation = useMutation({
    mutationFn: (values: z.infer<typeof formSchema>) =>
      updateUser({
        handle: values.handle,
        image: values.image,
        name: values.name,
        // @ts-expect-error
        bio: values.bio,
        website: values.website,
        socialLinks: values.socialLinks,
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

  const socialLinkFields: (keyof z.infer<typeof socialLinksSchema>)[] = [
    "twitter",
    "github",
    "instagram",
    "facebook",
    "youtube",
    "discord",
  ]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn("mt-4 space-y-4", className)}>
        <FormField
          control={form.control}
          name="handle"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={formItemLabelClassName}>{t("profile.handle.label")}</FormLabel>
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
              <FormLabel className={formItemLabelClassName}>{t("profile.name.label")}</FormLabel>
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
                <FormLabel className={formItemLabelClassName}>
                  {t("profile.avatar.label")}
                </FormLabel>
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

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={formItemLabelClassName}>{t("profile.profile.bio")}</FormLabel>
              <FormControl>
                <TextArea
                  rounded="lg"
                  {...field}
                  placeholder="Tell us about yourself..."
                  className="placeholder:text-text-tertiary min-h-[80px] resize-none p-3 text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={formItemLabelClassName}>
                {t("profile.profile.website")}
              </FormLabel>
              <FormControl>
                <Input type="url" {...field} placeholder="https://your-website.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel className={cn(formItemLabelClassName, "text-sm font-medium")}>
            {t("profile.profile.social_links")}
          </FormLabel>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {socialLinkFields.map((social) => (
              <FormField
                key={social}
                control={form.control}
                name={`socialLinks.${social}`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <label
                        className={cn(
                          "ring-accent/20 focus-within:border-accent/80 duration-200 focus-within:outline-none focus-within:ring-2",
                          "border-border bg-theme-background hover:bg-accent/5 flex cursor-text items-center gap-2 rounded-md border px-3 py-2 transition-colors dark:bg-zinc-700/[0.15]",
                        )}
                      >
                        <i
                          className={`${socialIconClassNames[social]} text-text-secondary shrink-0 text-base`}
                        />
                        <input
                          {...field}
                          placeholder={socialCopyMap[social]}
                          className="placeholder:text-text-tertiary border-0 !bg-transparent p-0 text-sm focus-visible:ring-0"
                        />
                      </label>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        <div className={cn("text-right", buttonClassName)}>
          <Button type="submit" isLoading={updateMutation.isPending}>
            {t("profile.submit")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
