import { parseMarkdown } from "@follow/components/utils/parse-markdown.js"
import { cn } from "@follow/utils"
import { isValidElement, useMemo } from "react"

import { ShikiHighLighter } from "~/components/ui/code-highlighter"
import { MermaidDiagram } from "~/components/ui/diagrams"

export const AIMarkdownMessage = ({
  text,
  className: classNameProp,
}: {
  text: string
  className?: string
}) => {
  const className = tw`prose dark:prose-invert text-sm
  prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-h5:text-base prose-h6:text-sm
  prose-li:list-disc prose-li:marker:text-accent prose-hr:border-border prose-hr:mx-8
`
  return (
    <div className={cn(className, classNameProp)}>
      {useMemo(
        () =>
          parseMarkdown(text, {
            components: {
              pre: ({ children }) => {
                // props
                const props = isValidElement(children) && "props" in children && children.props

                if (props) {
                  const { className, children } = props as any

                  if (
                    className &&
                    className.includes("language-") &&
                    typeof children === "string"
                  ) {
                    const language = className.replace("language-", "")
                    const code = children

                    // Render Mermaid diagrams
                    if (language === "mermaid") {
                      return <MermaidDiagram code={code} delayRender={800} />
                    }

                    return <ShikiHighLighter code={code} language={language} showCopy />
                  }
                }

                return <pre className="text-text-secondary">{children}</pre>
              },
            },
          }).content,
        [text],
      )}
    </div>
  )
}
