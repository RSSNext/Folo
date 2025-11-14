const LanguageAlias = {
  ts: "typescript",
  js: "javascript",

  tsx: "typescriptreact",
  jsx: "javascriptreact",
  md: "markdown",
}

const languageToIconMap = {
  javascriptreact: <i className="i-simple-icons-react" />,
  typescriptreact: <i className="i-simple-icons-react" />,
  javascript: <i className="i-simple-icons-javascript" />,
  typescript: <i className="i-simple-icons-typescript" />,
  html: <i className="i-simple-icons-html5" />,
  css: <i className="i-simple-icons-css3" />,
  markdown: <i className="i-simple-icons-markdown" />,
  json: <i className="i-simple-icons-json" />,
  yaml: <i className="i-simple-icons-yaml" />,
  bash: <i className="i-simple-icons-shell" />,
}

export const getLanguageIcon = (language?: string) => {
  if (!language) return null

  const alias = LanguageAlias[language]
  if (alias) {
    return languageToIconMap[alias]
  }

  return languageToIconMap[language]
}
