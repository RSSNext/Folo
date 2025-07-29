import { IconButton } from "@follow/components/ui/button/index.js"
import { Checkbox } from "@follow/components/ui/checkbox/index.jsx"
import { Popover, PopoverContent, PopoverTrigger } from "@follow/components/ui/popover/index.jsx"
import { getStorageNS } from "@follow/utils/ns"
import { parseSafeUrl } from "@follow/utils/utils"
import { Label } from "@radix-ui/react-label"
import { PopoverPortal } from "@radix-ui/react-popover"
import { atomWithStorage } from "jotai/utils"
import { useState } from "react"

import { useGeneralSettingKey, useGeneralSettingValue } from "~/atoms/settings/general"
import { jotaiStore } from "~/lib/jotai"
import { withSettingEnabled } from "~/modules/settings/helper/withSettingEnable"

const TrustedKey = getStorageNS("trusted-external-link")
const trustedAtom = atomWithStorage(TrustedKey, [] as string[], undefined, {
  getOnInit: true,
})

const trustedDefaultLinks = new Set([
  "github.com",
  "gitlab.com",
  "google.com",
  "sspai.com",
  "x.com",
  "twitter.com",
  "diygod.me",
  "diygod.cc",

  "v2ex.com",
  "pixiv.net",
  "youtube.com",

  "bilibili.com",
  "xiaoyuzhoufm.com",
  "xlog.app",
  "rss3.io",
])

const getURLDomain = (url: string) => {
  const urlObj = parseSafeUrl(url)
  return urlObj?.hostname ?? null
}

const WarnGoToExternalLinkImpl = ({
  ref,
  ...rest
}: React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> & {
  ref?: React.Ref<HTMLAnchorElement | null>
}) => {
  const [open, setOpen] = useState(false)
  const [checked, setChecked] = useState<boolean | "indeterminate">(false)

  const shouldWarn = useGeneralSettingKey("jumpOutLinkWarn")
  const handleOpen: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    rest.onClick?.(e)
    if (!shouldWarn) return
    const { href } = rest
    if (!href) return
    const domain = getURLDomain(href)

    if (
      domain &&
      !trustedDefaultLinks.has(domain) &&
      !jotaiStore.get(trustedAtom).includes(domain)
    ) {
      setOpen(true)
      e.preventDefault()
    }
  }
  const handleGo = () => {
    open()
    if (!checked) {
      return
    }

    const { href } = rest
    if (!href) return

    const domain = getURLDomain(href)
    if (domain && !jotaiStore.get(trustedAtom).includes(domain)) {
      jotaiStore.set(trustedAtom, (prev) => [...prev, domain])
    }

    function open() {
      if (!rest.href) return
      window.open(rest.href, "_blank", "noopener,noreferrer")
      setOpen(false)
    }
  }
  return (
    <Popover open={open} onOpenChange={(v) => !v && setOpen(false)}>
      <PopoverTrigger asChild>
        <a ref={ref} {...rest} onClick={handleOpen} />
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent>
          <p className="max-w-[50ch] text-sm">
            You are about to leave this site to go to an external page, do you trust this URL and go
            to it?
          </p>
          <p className="mt-2 text-center text-sm underline">{rest.href}</p>

          <div className="mt-3 flex justify-between">
            <Label className="center flex">
              <Checkbox checked={checked} onCheckedChange={setChecked} />
              <span className="ml-2 text-[13px]">Trust this domain</span>
            </Label>

            <IconButton icon={<i className="i-mingcute-arrow-right-line" />} onClick={handleGo}>
              <span className="duration-200 group-hover:opacity-0">Go</span>
            </IconButton>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  )
}

export const WarnGoToExternalLink = withSettingEnabled(
  useGeneralSettingValue,
  (s) => s.jumpOutLinkWarn,
)(WarnGoToExternalLinkImpl, "a")
