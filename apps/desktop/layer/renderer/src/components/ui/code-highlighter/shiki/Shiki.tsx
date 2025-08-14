import { ELECTRON_BUILD } from "@follow/shared/constants"
import { cn } from "@follow/utils/utils"
import { useIsomorphicLayoutEffect } from "foxact/use-isomorphic-layout-effect"
import type { FC } from "react"
import { memo, useInsertionEffect, useMemo, useRef, useState } from "react"
import type {
  BundledLanguage,
  BundledTheme,
  DynamicImportLanguageRegistration,
  DynamicImportThemeRegistration,
} from "shiki"

import { useUISettingKey } from "~/atoms/settings/ui"
import { ipcServices } from "~/lib/client"

import { CopyButton } from "../../button/CopyButton"
import { getLanguageIcon } from "../constants"
import { useShikiDefaultTheme } from "./hooks"
import { shiki, shikiTransformers } from "./shared"
import styles from "./shiki.module.css"

export interface ShikiProps {
  language: string | undefined
  code: string

  attrs?: string
  className?: string

  transparent?: boolean
  showCopy?: boolean

  theme?: string
}

let langModule: Record<BundledLanguage, DynamicImportLanguageRegistration> | null = null
let themeModule: Record<BundledTheme, DynamicImportThemeRegistration> | null = null
let bundledLanguagesKeysSet: Set<string> | null = null

export const ShikiHighLighter: FC<ShikiProps> = (props) => {
  const { code, language, className, theme: overrideTheme } = props
  const [currentLanguage, setCurrentLanguage] = useState(language || "plaintext")

  const guessCodeLanguage = useUISettingKey("guessCodeLanguage")
  useInsertionEffect(() => {
    if (!guessCodeLanguage) return
    if (language || !ELECTRON_BUILD) return

    if (!bundledLanguagesKeysSet) {
      import("shiki/langs")
        .then(({ bundledLanguages }) => {
          langModule = bundledLanguages
          bundledLanguagesKeysSet = new Set(Object.keys(bundledLanguages))
        })
        .then(guessLanguage)
    } else {
      guessLanguage()
    }

    function guessLanguage() {
      return ipcServices?.reader.detectCodeStringLanguage({ codeString: code }).then((result) => {
        if (!result) {
          return
        }
        if (bundledLanguagesKeysSet?.has(result.languageId)) {
          setCurrentLanguage(result.languageId)
        }
      })
    }
  }, [guessCodeLanguage])

  const loadThemesRef = useRef([] as string[])
  const loadLanguagesRef = useRef([] as string[])

  const [loaded, setLoaded] = useState(false)

  const codeTheme = useShikiDefaultTheme(overrideTheme)

  useIsomorphicLayoutEffect(() => {
    let isMounted = true
    setLoaded(false)

    async function loadShikiLanguage(language: string, languageModule: any) {
      if (!shiki) return
      if (!shiki.getLoadedLanguages().includes(language)) {
        await shiki.loadLanguage(await languageModule())
      }
    }
    async function loadShikiTheme(theme: string, themeModule: any) {
      if (!shiki) return
      if (!shiki.getLoadedThemes().includes(theme)) {
        await shiki.loadTheme(await themeModule())
      }
    }

    async function register() {
      if (!currentLanguage || !codeTheme) return

      const [{ bundledLanguages }, { bundledThemes }] =
        langModule && themeModule
          ? [
              {
                bundledLanguages: langModule,
              },
              { bundledThemes: themeModule },
            ]
          : await Promise.all([import("shiki/langs"), import("shiki/themes")])

      langModule = bundledLanguages
      themeModule = bundledThemes

      if (
        currentLanguage &&
        loadLanguagesRef.current.includes(currentLanguage) &&
        codeTheme &&
        loadThemesRef.current.includes(codeTheme)
      ) {
        return
      }
      return Promise.all([
        (async () => {
          if (currentLanguage) {
            const importFn = (bundledLanguages as any)[currentLanguage]
            if (!importFn) return
            await loadShikiLanguage(currentLanguage || "", importFn)
            loadLanguagesRef.current.push(currentLanguage)
          }
        })(),
        (async () => {
          if (codeTheme) {
            const importFn = (bundledThemes as any)[codeTheme]
            if (!importFn) return
            await loadShikiTheme(codeTheme || "", importFn)
            loadThemesRef.current.push(codeTheme)
          }
        })(),
      ])
    }
    register().then(() => {
      if (isMounted) {
        setLoaded(true)
      }
    })
    return () => {
      isMounted = false
    }
  }, [codeTheme, currentLanguage])

  if (!loaded) {
    return (
      <pre className={cn("bg-transparent", className)}>
        <code>{code}</code>
      </pre>
    )
  }
  return <ShikiCode {...props} language={currentLanguage} codeTheme={codeTheme} />
}

export const MemoizedShikiCode = memo(ShikiHighLighter)
const ShikiCode: FC<
  ShikiProps & {
    codeTheme: string
  }
> = ({ code, language, codeTheme, className, transparent, showCopy = true }) => {
  const rendered = useMemo(() => {
    try {
      return shiki.codeToHtml(code, {
        lang: language!,
        themes: {
          dark: codeTheme,
          light: codeTheme,
        },
        transformers: shikiTransformers,
      })
    } catch {
      return null
    }
  }, [code, language, codeTheme])

  if (!rendered) {
    return (
      <pre className={className}>
        <code>{code}</code>
      </pre>
    )
  }

  return (
    <div
      className={cn(
        "my-4 border",
        styles["shiki-wrapper"],
        transparent ? styles["transparent"] : null,
        className,
      )}
    >
      <div className="flex items-center justify-between border-b p-2">
        {language === "plaintext" ? (
          <div />
        ) : (
          <span className="center flex gap-1 text-xs uppercase opacity-80 dark:text-white">
            <span className="center [&_svg]:size-4">{getLanguageIcon(language)}</span>
            <span>{language}</span>
          </span>
        )}
        <CopyButton variant="outline" value={code} className={showCopy ? "" : "invisible"} />
      </div>
      <div dangerouslySetInnerHTML={{ __html: rendered }} data-language={language} />
    </div>
  )
}
