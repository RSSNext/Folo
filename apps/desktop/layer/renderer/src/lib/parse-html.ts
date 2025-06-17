import { MemoedDangerousHTMLStyle } from "@follow/components/common/MemoedDangerousHTMLStyle.jsx"
import { Checkbox } from "@follow/components/ui/checkbox/index.jsx"
import { LazyKateX } from "@follow/components/ui/katex/lazy.js"
import { parseHtml as parseHtmlGeneral } from "@follow/utils/html"
import type { Element } from "hast"
import type { Components } from "hast-util-to-jsx-runtime"
import { createElement } from "react"
import { renderToString } from "react-dom/server"

import { ShadowDOM } from "~/components/common/ShadowDOM"
import { ShikiHighLighter } from "~/components/ui/code-highlighter"
import { MarkdownBlockImage, MarkdownLink, MarkdownP } from "~/components/ui/markdown/renderers"
import { useIsInParagraphContext } from "~/components/ui/markdown/renderers/ctx"
import { createHeadingRenderer } from "~/components/ui/markdown/renderers/Heading"
import { MarkdownInlineImage } from "~/components/ui/markdown/renderers/InlineImage"
import { Media } from "~/components/ui/media/Media"

function markInlineImage(node?: Element) {
  for (const item of node?.children ?? []) {
    if (item.type === "element" && item.tagName === "img") {
      ;(item.properties as any).inline = true
    }
  }
}

export const parseHtml = (
  content: string,
  options?: Partial<{
    renderInlineStyle: boolean
    noMedia?: boolean
  }>,
) => {
  return parseHtmlGeneral(content, {
    ...options,
    components: {
      a: ({ node, ...props }) => {
        // markInlineImage(node)
        return createElement(MarkdownLink, { ...props } as any)
      },
      img: Img,

      h1: ({ ref, ...props }) => {
        markInlineImage(props.node)
        return createHeadingRenderer(1)(props)
      },
      h2: ({ ref, ...props }) => {
        markInlineImage(props.node)
        return createHeadingRenderer(2)(props)
      },
      h3: ({ ref, ...props }) => {
        markInlineImage(props.node)
        return createHeadingRenderer(3)(props)
      },
      h4: ({ ref, ...props }) => {
        markInlineImage(props.node)
        return createHeadingRenderer(4)(props)
      },
      h5: ({ ref, ...props }) => {
        markInlineImage(props.node)
        return createHeadingRenderer(5)(props)
      },
      h6: ({ ref, ...props }) => {
        markInlineImage(props.node)
        return createHeadingRenderer(6)(props)
      },
      style: Style,

      video: ({ node, ...props }) => {
        const sourceElement = Array.isArray(props.children)
          ? props.children.find((i) => i.type === "source")
          : // Children is only the source element
            props.children &&
              typeof props.children === "object" &&
              "type" in props.children &&
              props.children.type === "source"
            ? props.children
            : null

        const src = props.src || sourceElement?.props.src
        return createElement(Media, {
          ...props,
          popper: true,
          type: "video",
          previewImageUrl: props.poster,
          src,
        })
      },

      p: ({ node, ref, ...props }) => {
        if (node?.children && node.children.length !== 1) {
          for (const item of node.children) {
            item.type === "element" &&
              item.tagName === "img" &&
              ((item.properties as any).inline = true)
          }
        }
        return createElement(MarkdownP, props, props.children)
      },
      span: ({ node, ...props }) => {
        markInlineImage(node)
        return createElement("span", props, props.children)
      },
      b: ({ node, ...props }) => {
        markInlineImage(node)
        return createElement("b", props, props.children)
      },
      i: ({ node, ...props }) => {
        markInlineImage(node)
        return createElement("i", props, props.children)
      },
      math: Math,
      hr: ({ node, ...props }) =>
        createElement("hr", {
          ...props,
          className: tw`scale-x-50`,
        }),
      input: ({ node, ...props }) => {
        if (props.type === "checkbox") {
          return createElement(Checkbox, {
            ...props,
            disabled: false,
            className: tw`pointer-events-none mr-2`,
          } as any)
        }
        return createElement("input", props)
      },
      pre: ({ node, ...props }) => {
        if (!props.children) return null

        let language = ""

        let codeString = null as string | null
        if (props.className?.includes("language-")) {
          language = props.className.replace("language-", "")
        }

        if (typeof props.children !== "object") {
          codeString = props.children.toString()
        } else {
          const propsChildren = props.children
          const children = Array.isArray(propsChildren)
            ? propsChildren.find((i) => i.type === "code")
            : propsChildren

          // Don't process not code block
          if (!children) return createElement("pre", props, props.children)

          if (
            "type" in children &&
            children.type === "code" &&
            children.props.className?.includes("language-")
          ) {
            language = children.props.className.replace("language-", "")
          }
          const code = ("props" in children && children.props.children) || children
          if (!code) return null

          try {
            codeString = extractCodeFromHtml(renderToString(code))
          } catch (error) {
            console.error("Code Block Render Error", error)
            return createElement("pre", props, props.children)
          }
        }

        if (!codeString) return createElement("pre", props, props.children)
        // Workaround for Hugo's code block
        // Code line number in Hugo will render inside <pre> tag
        const isLineNumberInHugo = codeString.slice(0, 15).split(" ").join("").startsWith("1\n2\n3")

        return createElement(ShikiHighLighter, {
          code: codeString.trimEnd(),
          language: language.toLowerCase(),
          showCopy: !isLineNumberInHugo,
        })
      },
      figure: ({ node, ...props }) =>
        createElement(
          "figure",
          {
            className: "max-w-full",
          },
          props.children,
        ),
      table: ({ node, ...props }) =>
        createElement(
          "div",
          {
            className: "w-full overflow-x-auto",
          },

          createElement("table", {
            ...props,
            className: tw`w-full my-0`,
          }),
        ),
      td: ({ node, ...props }) =>
        // Workaround for Hugo's table code
        createElement("td", { ...props, className: tw`p-0` }, props.children),
    },
  })
}

const Img: Components["img"] = ({ node, ...props }) => {
  const nextProps = {
    ...props,
    preferOrigin: true,
    proxy: { height: 0, width: 700 },
  }
  const widthPx = Number.parseInt(props.width as string)

  return createElement(
    node?.properties.inline && (Number.isNaN(widthPx) || widthPx < 600)
      ? MarkdownInlineImage
      : MarkdownBlockImage,
    nextProps,
  )
}

export function extractCodeFromHtml(htmlString: string) {
  const tempDiv = document.createElement("div")
  tempDiv.innerHTML = htmlString

  const hasPre = tempDiv.querySelector("pre")
  if (!hasPre) {
    tempDiv.innerHTML = `<pre><code>${htmlString}</code></pre>`
  }

  // 1. line break via <div />
  const divElements = tempDiv.querySelectorAll("div")

  let code = ""

  if (divElements.length > 0) {
    divElements.forEach((div) => {
      code += `${div.textContent}\n`
    })
    return code
  }

  // 2. line wrapper like <span><span>...</span></span>
  const spanElements = tempDiv.querySelectorAll("span > span")

  // 2.1 outside <span /> as a line break?

  let spanAsLineBreak = false

  if (tempDiv.children.length > 2) {
    for (const node of tempDiv.children) {
      const span = node as HTMLSpanElement
      // 2.2 If the span has only one child and it's a line break, then span can be as a line break
      spanAsLineBreak = span.children.length === 1 && span.childNodes.item(0).textContent === "\n"
      if (spanAsLineBreak) break
    }
  }

  if (!spanAsLineBreak) {
    const usingBr = tempDiv.querySelector("br")
    if (usingBr) {
      spanAsLineBreak = true
    }
  }

  if (spanElements.length > 0) {
    for (const node of tempDiv.children) {
      if (spanAsLineBreak) {
        code += `${node.textContent}`
      } else {
        code += `${node.textContent}\n`
      }
    }

    return code
  }

  return tempDiv.textContent
}

const Style: Components["style"] = ({ node, ...props }) => {
  const isShadowDOM = ShadowDOM.useIsShadowDOM()

  if (isShadowDOM && typeof props.children === "string") {
    return createElement(
      MemoedDangerousHTMLStyle,
      null,
      props.children.replaceAll(/html|body/g, "#shadow-html"),
    )
  }
  return null
}

const Math = ({ node }) => {
  const annotation = node.children.at(-1)

  const isInParagraph = useIsInParagraphContext()
  if (!annotation) return null
  const latex = annotation.value

  return createElement(LazyKateX, {
    children: latex,
    mode: isInParagraph ? "inline" : "display",
  })
}
