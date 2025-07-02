import { isMobile } from "@follow/components/hooks/useMobile.js"
import type { UISettings } from "@follow/shared/settings/interface"
import { useUnreadAll } from "@follow/store/unread/hooks"
import i18next from "i18next"
import { useEffect, useInsertionEffect, useLayoutEffect, useRef } from "react"

import { useGeneralSettingKey } from "~/atoms/settings/general"
import { useUISettingValue } from "~/atoms/settings/ui"
import { I18N_LOCALE_KEY } from "~/constants"
import { useReduceMotion } from "~/hooks/biz/useReduceMotion"
import { useSyncTheme } from "~/hooks/common"
import { langChain } from "~/i18n"
import { ipcServices } from "~/lib/client"
import { loadLanguageAndApply } from "~/lib/load-language"

const useUpdateDockBadge = (setting: UISettings) => {
  const unreadCount = useUnreadAll()

  useEffect(() => {
    if (setting.showDockBadge) {
      ipcServices?.dock.pollingUpdateUnreadCount()
    } else {
      ipcServices?.dock.cancelPollingUpdateUnreadCount().then(() => {
        ipcServices?.dock.setDockBadge(0)
      })
    }
    return
  }, [setting.showDockBadge])

  const prevCount = useRef<null | number>(null)
  useEffect(() => {
    if (!setting.showDockBadge) {
      return
    }
    if (prevCount.current === unreadCount) {
      return
    }

    ipcServices?.dock.setDockBadge(unreadCount).then(() => {
      prevCount.current = unreadCount
    })
  }, [unreadCount, setting.showDockBadge])
}

const useUISettingSync = () => {
  const setting = useUISettingValue()
  const mobile = isMobile()
  useSyncTheme()
  useInsertionEffect(() => {
    const root = document.documentElement
    root.style.fontSize = `${setting.uiTextSize * (mobile ? 1.125 : 1)}px`
  }, [setting.uiTextSize])

  useInsertionEffect(() => {
    const root = document.documentElement
    // https://developer.mozilla.org/en-US/docs/Web/CSS/font-family#valid_family_names
    const fontCss = `"${setting.uiFontFamily}", system-ui, sans-serif`

    Object.assign(root.style, {
      fontFamily: fontCss,
    })
    root.style.cssText += `\n--fo-font-family: ${fontCss}`
    root.style.cssText += `\n--pointer: ${setting.usePointerCursor ? "pointer" : "default"}`
    Object.assign(document.body.style, {
      fontFamily: fontCss,
    })
  }, [setting.uiFontFamily, setting.usePointerCursor])

  useUpdateDockBadge(setting)
}

const useUXSettingSync = () => {
  const reduceMotion = useReduceMotion()
  useLayoutEffect(() => {
    document.documentElement.dataset.motionReduce = reduceMotion ? "true" : "false"
  }, [reduceMotion])
}

const useLanguageSync = () => {
  const language = useGeneralSettingKey("language")
  useEffect(() => {
    let mounted = true

    if (language === "zh-TW") {
      loadLanguageAndApply("zh-CN")
    }
    loadLanguageAndApply(language as string).then(() => {
      langChain.next(() => {
        if (mounted) {
          localStorage.setItem(I18N_LOCALE_KEY, language as string)
          return i18next.changeLanguage(language as string)
        }
      })
    })

    return () => {
      mounted = false
    }
  }, [language])
}
const useGeneralSettingSync = () => {
  useGeneralSettingKey("voice")
}

export const SettingSync = () => {
  useUISettingSync()
  useUXSettingSync()
  useLanguageSync()
  useGeneralSettingSync()
  return null
}
