import {
  MdiLanguageCss3,
  MdiLanguageHtml5,
  MdiLanguageJavascript,
  MdiLanguageTypescript,
  RiMarkdownFill,
  UilReact,
} from "@follow/components/icons/Language.jsx"

const LanguageAlias = {
  ts: "typescript",
  js: "javascript",

  tsx: "typescriptreact",
  jsx: "javascriptreact",
  md: "markdown",
}

const languageToIconMap = {
  javascriptreact: <UilReact />,
  typescriptreact: <UilReact />,
  javascript: <MdiLanguageJavascript />,
  typescript: <MdiLanguageTypescript />,
  html: <MdiLanguageHtml5 />,
  css: <MdiLanguageCss3 />,
  markdown: <RiMarkdownFill />,
}

export const getLanguageIcon = (language?: string) => {
  if (!language) return null

  const alias = LanguageAlias[language]
  if (alias) {
    return languageToIconMap[alias]
  }

  return languageToIconMap[language]
}
