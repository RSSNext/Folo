import clsx from "clsx"
import { useIsomorphicLayoutEffect } from "foxact/use-isomorphic-layout-effect"
import { useAtomValue } from "jotai"
import type { FC } from "react"
import { useMemo, useRef, useState } from "react"
import type {
  BundledLanguage,
  BundledTheme,
  DynamicImportLanguageRegistration,
  DynamicImportThemeRegistration,
} from "shiki"
import { useMediaQuery } from "usehooks-ts"

import { codeThemeDarkAtom, codeThemeLightAtom } from "~/atoms"

import { shiki, shikiTransformers } from "./shared"
import styles from "./shiki.module.css"

export interface ShikiProps {
  language: string | undefined
  code: string

  attrs?: string
  className?: string

  transparent?: boolean

  theme?: string
}

const useIsDark = () => {
  const isDark = useMediaQuery("(prefers-color-scheme: dark)")
  return isDark
}

let langModule: Record<BundledLanguage, DynamicImportLanguageRegistration> | null = null
let themeModule: Record<BundledTheme, DynamicImportThemeRegistration> | null = null

export const ShikiHighLighter: FC<ShikiProps> = (props) => {
  const { code, language, className } = props
  const [currentLanguage] = useState(language || "plaintext")

  const loadThemesRef = useRef([] as string[])
  const loadLanguagesRef = useRef([] as string[])

  const [loaded, setLoaded] = useState(false)

  const isDark = useIsDark()
  const codeThemeLight = useAtomValue(codeThemeLightAtom) || "github-dark"
  const codeThemeDark = useAtomValue(codeThemeDarkAtom) || "github-dark"
  const codeTheme = isDark ? codeThemeDark : codeThemeLight

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
      <pre className={clsx("bg-transparent", className)}>
        <code>{code}</code>
      </pre>
    )
  }
  return <ShikiCode {...props} language={currentLanguage} codeTheme={codeTheme} />
}

const ShikiCode: FC<
  ShikiProps & {
    codeTheme: string
  }
> = ({ code, language, codeTheme, className, transparent }) => {
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
      className={clsx(
        "group relative -mx-3 my-4",
        styles["shiki-wrapper"],
        transparent ? styles["transparent"] : null,
        className,
      )}
    >
      <div dangerouslySetInnerHTML={{ __html: rendered }} data-language={language} />

      {language !== "plaintext" && (
        <span className="center absolute bottom-2 right-2 flex gap-1 text-xs uppercase opacity-80 dark:text-white">
          <span>{language}</span>
        </span>
      )}
    </div>
  )
}
