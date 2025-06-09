import { IN_ELECTRON } from "@follow/shared/constants"
import { getEntry } from "@follow/store/entry/getter"
import { cn } from "@follow/utils/utils"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { ipcServices } from "~/lib/client"

interface SharePanelProps {
  entryId: string
}

interface ShareOption {
  id: string
  label: string
  icon: string
  action: () => Promise<void> | void
  color?: string
  bgColor?: string
}

interface SocialShareOption {
  id: string
  label: string
  icon: string
  url: string
  color: string
  bgColor: string
}

const socialOptions: SocialShareOption[] = [
  {
    id: "twitter",
    label: "X",
    icon: tw`i-mgc-social-x-cute-re`,
    url: "https://x.com/intent/tweet?text={text}&url={url}",
    color: "text-white",
    bgColor: "bg-black",
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: tw`i-mgc-facebook-cute-re`,
    url: "https://www.facebook.com/sharer/sharer.php?u={url}",
    color: "text-white",
    bgColor: "bg-[#1877F2]",
  },
  {
    id: "telegram",
    label: "Telegram",
    icon: tw`i-mgc-telegram-cute-re`,
    url: "https://t.me/share/url?url={url}&text={text}",
    color: "text-white",
    bgColor: "bg-[#0088CC]",
  },
  {
    id: "weibo",
    label: "微博",
    icon: tw`i-mgc-weibo-cute-re`,
    url: "https://service.weibo.com/share/share.php?url={url}&title={text}",
    color: "text-white",
    bgColor: "bg-[#E6162D]",
  },
]

const getShareUrl = (entryId: string) => {
  const entry = getEntry(entryId)
  if (!entry) return ""

  // Temporarily use the original link
  return entry.url!
  // const params = getRouteParams()

  // let subscriptionId = "all"

  // if (params.feedId) {
  //   subscriptionId = params.feedId
  // } else if (params.inboxId) {
  //   subscriptionId = params.inboxId
  // } else if (params.listId) {
  //   subscriptionId = params.listId
  // }

  // return UrlBuilder.shareEntry(entryId, {
  //   view: params.view,
  //   subscriptionId,
  // })
}

export const SharePanel = ({ entryId }: SharePanelProps) => {
  const { t } = useTranslation()

  const generateShareContent = useCallback(
    (entry: ReturnType<typeof getEntry>) => {
      if (!entry) return null

      const { title, description } = entry
      const shareUrl = getShareUrl(entryId)

      // Limit text to 50 characters with ellipsis
      const truncateText = (text: string, maxLength = 50) => {
        return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
      }

      const shareTitle = `${title || t("share.default_title")} - Folo`
      const baseText = description || title || t("share.default_description")
      const truncatedText = truncateText(baseText)
      const shareText = `${truncatedText} | ${t("share.discover_more")}`

      return {
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      }
    },
    [entryId, t],
  )

  const handleNativeShare = useCallback(async () => {
    const entry = getEntry(entryId)
    const shareContent = generateShareContent(entry)

    if (!shareContent) return

    try {
      if (IN_ELECTRON) {
        // Use Electron's share menu
        await ipcServices?.menu.showShareMenu(shareContent.url)
      } else if (navigator.share) {
        // Use Web Share API
        await navigator.share({
          title: shareContent.title,
          text: shareContent.text,
          url: shareContent.url,
        })
      } else {
        // Fallback to copying link
        await navigator.clipboard.writeText(shareContent.url)
        toast.success(t("share.link_copied"))
      }
    } catch {
      // If sharing fails, copy link as fallback
      try {
        await navigator.clipboard.writeText(shareContent.url)
        toast.success(t("share.link_copied"))
      } catch {
        toast.error(t("share.copy_failed"))
      }
    }
  }, [entryId, generateShareContent, t])

  const handleCopyLink = useCallback(async () => {
    const shareUrl = getShareUrl(entryId)
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success(t("share.link_copied"))
    } catch {
      toast.error(t("share.copy_failed"))
    }
  }, [entryId, t])

  const handleSocialShare = useCallback(
    (shareUrlTemplate: string) => {
      const entry = getEntry(entryId)
      const shareContent = generateShareContent(entry)

      if (!shareContent) return

      const encodedUrl = encodeURIComponent(shareContent.url)
      const shareTitle = encodeURIComponent(shareContent.title)
      const shareText = encodeURIComponent(shareContent.text)

      const finalUrl = shareUrlTemplate
        .replace("{url}", encodedUrl)
        .replace("{title}", shareTitle)
        .replace("{text}", shareText)

      window.open(finalUrl, "_blank", "width=600,height=400")
    },
    [entryId, generateShareContent],
  )

  const actionOptions: ShareOption[] = [
    ...(IN_ELECTRON || (typeof navigator !== "undefined" && "share" in navigator)
      ? [
          {
            id: "native-share",
            label: t("share.system_share"),
            icon: "i-mgc-share-forward-cute-re",
            action: handleNativeShare,
            color: "text-blue-500",
          },
        ]
      : []),
    {
      id: "copy-link",
      label: t("share.copy_link"),
      icon: "i-mgc-link-cute-re",
      action: handleCopyLink,
    },
  ]

  return (
    <div className="pointer-events-auto max-w-[400px] px-2">
      <div className="mb-4 flex flex-col text-center">
        <h3 className="text-text mb-2 mt-1 font-semibold">{t("share.title")}</h3>
        {(() => {
          const entry = getEntry(entryId)
          const title = entry?.title
          return title ? (
            <p className="text-text-secondary mt-1 min-w-0 text-wrap text-left text-sm font-medium">
              {title}
            </p>
          ) : null
        })()}
      </div>

      <div className="mb-6">
        <div className="mb-3">
          <h4 className="text-text-secondary text-xs font-medium uppercase tracking-wide">
            {t("share.social_media")}
          </h4>
        </div>
        <div className="flex items-center gap-4">
          {socialOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className="group flex flex-col items-center gap-2"
              onClick={() => handleSocialShare(option.url)}
            >
              <div
                className={cn(
                  "flex size-12 items-center justify-center rounded-full transition-all duration-200",
                  option.bgColor,
                  "group-hover:scale-110 group-active:scale-95",
                  "shadow-lg",
                )}
              >
                <i className={cn(option.icon, "size-5", option.color)} />
              </div>
              <span className="text-text-secondary text-xs font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3">
          <h4 className="text-text-secondary text-xs font-medium uppercase tracking-wide">
            {t("share.actions")}
          </h4>
        </div>
        <div className="flex flex-col gap-1">
          {actionOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={cn(
                "cursor-button relative flex select-none items-center rounded-lg",
                "text-sm outline-none transition-all duration-200",
                "hover:bg-fill-secondary/80 active:bg-fill-secondary",
                "group",
              )}
              onClick={() => option.action()}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full",
                    "bg-fill-tertiary/80 group-hover:bg-fill-tertiary",
                    "transition-colors duration-200",
                  )}
                >
                  <i
                    className={cn(option.icon, "size-3.5", option.color || "text-text-secondary")}
                  />
                </div>
                <span className="text-text text-xs font-medium">{option.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
