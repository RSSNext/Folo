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
import { useWhoami } from "@follow/store/user/hooks"
import { userActions } from "@follow/store/user/store"
import { cn } from "@follow/utils/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import { AvatarUploadModal } from "~/components/ui/crop/AvatarUploadModal"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { updateUser } from "~/lib/auth"
import { uploadAvatarBlob } from "~/lib/avatar-upload"
import { toastFetchError } from "~/lib/error-parser"

const socialLinksSchema = z.object({
  twitter: z.string().max(32).optional(),
  github: z.string().max(32).optional(),
  instagram: z.string().max(32).optional(),
  facebook: z.string().max(32).optional(),
  youtube: z.string().max(32).optional(),
  discord: z.string().max(32).optional(),
})

const formSchema = z.object({
  handle: z.string().max(32).regex(/^\w+$/).optional(),
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

export const ProfileSettingForm = ({
  className,
  buttonClassName,
  hideAvatar,
}: {
  className?: string
  buttonClassName?: string
  hideAvatar?: boolean
}) => {
  const { t } = useTranslation("settings")
  const user = useWhoami() as ExtendedUser
  const { present } = useModalStack()

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
    mutationFn: (values: Partial<z.infer<typeof formSchema>>) =>
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
        userActions.updateWhoami({ ...variables })
      }
      toast(t("profile.updateSuccess"), {
        duration: 3000,
      })
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateMutation.mutate(values)
  }

  const handleAvatarUpload = async (blob: Blob) => {
    try {
      const imageUrl = await uploadAvatarBlob(blob)
      form.setValue("image", imageUrl)
      toast.success(t("profile.avatar.uploadSuccess"))
      updateMutation.mutate({ image: imageUrl })
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(t("profile.avatar.uploadError"))
    }
  }

  const openAvatarUpload = () => {
    present({
      title: t("profile.avatar.uploadTitle"),
      content: ({ dismiss }) => (
        <AvatarUploadModal
          maxSizeKB={1024}
          onConfirm={async (blob) => {
            await handleAvatarUpload(blob)
            dismiss()
          }}
          onCancel={dismiss}
        />
      ),
    })
  }

  const socialLinkFields: (keyof z.infer<typeof socialLinksSchema>)[] = [
    "twitter",
    "github",
    "instagram",
    "facebook",
    "youtube",
    "discord",
  ]

  const socialCopyMap = {
    twitter: t("profile.profile.social_links_twitter"),
    github: t("profile.profile.social_links_github"),
    instagram: t("profile.profile.social_links_instagram"),
    facebook: t("profile.profile.social_links_facebook"),
    youtube: t("profile.profile.social_links_youtube"),
    discord: t("profile.profile.social_links_discord"),
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn("mt-4 space-y-4", className)}>
        {!hideAvatar && (
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <div className="absolute right-0 flex -translate-y-full gap-4">
                <FormItem className="w-full">
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={openAvatarUpload}
                        className="group relative cursor-pointer transition-all duration-200 hover:opacity-80"
                      >
                        <Avatar className="size-16">
                          <AvatarImage src={field.value} />
                          <AvatarFallback>{user?.name?.[0] || ""}</AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          <i className="i-mgc-pic-cute-fi text-xl text-white" />
                        </div>
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="handle"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={formItemLabelClassName}>{t("profile.handle.label")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription className={formItemLabelClassName}>
                {t("profile.handle.description")}
              </FormDescription>
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
              <FormDescription className={formItemLabelClassName}>
                {t("profile.name.description")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {hideAvatar && (
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
                      <button
                        type="button"
                        onClick={openAvatarUpload}
                        className="group relative cursor-pointer transition-all duration-200 hover:opacity-80"
                      >
                        <Avatar className="size-8">
                          <AvatarImage src={field.value} />
                          <AvatarFallback>{user?.name?.[0] || ""}</AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          <i className="i-mgc-pic-cute-fi text-xl text-white" />
                        </div>
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>
            )}
          />
        )}

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
                  placeholder={t("profile.profile.bio_placeholder")}
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
                          "ring-accent/20 focus-within:border-accent/80 h-9 duration-200 focus-within:outline-none focus-within:ring-2",
                          "border-border bg-theme-background hover:bg-accent/5 flex cursor-text items-center gap-2 rounded-lg border px-3 py-2 transition-colors dark:bg-zinc-700/[0.15]",
                        )}
                      >
                        <i
                          className={`${socialIconClassNames[social]} text-text-secondary shrink-0 text-base`}
                        />
                        <input
                          {...field}
                          placeholder={socialCopyMap[social]}
                          className="placeholder:text-text-tertiary flex-1 border-0 !bg-transparent p-0 text-sm focus-visible:ring-0"
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
