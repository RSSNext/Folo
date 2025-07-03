import "@microflash/remark-callout-directives/themes/github/index.css"
import "remark-gh-alerts/styles/github-colors-light.css"
import "remark-gh-alerts/styles/github-colors-dark-media.css"
import "remark-gh-alerts/styles/github-base.css"

// @ts-ignore
import remarkCalloutDirectives from "@microflash/remark-callout-directives"
import type { Components } from "hast-util-to-jsx-runtime"
import { toJsxRuntime } from "hast-util-to-jsx-runtime"
import { Fragment, jsx, jsxs } from "react/jsx-runtime"
import rehypeStringify from "rehype-stringify"
import remarkDirective from "remark-directive"
import remarkGfm from "remark-gfm"
import remarkGithubAlerts from "remark-gh-alerts"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import type { Processor } from "unified"
import { unified } from "unified"

export interface RemarkOptions {
  components: Partial<Components>
  applyMiddleware?: <T extends Processor<any, any, any, any, any>>(pipeline: T) => T
}

export const parseMarkdown = (content: string, options?: Partial<RemarkOptions>) => {
  const { components, applyMiddleware } = options || {}

  let pipeline: Processor<any, any, any, any, any> = unified()
    .use(remarkDirective)
    .use(remarkParse)

    .use(remarkGfm)
    .use(remarkGithubAlerts)

    .use(remarkCalloutDirectives, {
      aliases: {
        danger: "deter",
        tip: "note",
        warning: "warn",
      },
      callouts: {
        note: {
          title: "Note",
          hint: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 8h.01M12 12v4"/><circle cx="12" cy="12" r="10"/></svg>`,
        },
        commend: {
          title: "Success",
          hint: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m8 12 2.7 2.7L16 9.3"/><circle cx="12" cy="12" r="10"/></svg>`,
        },
        warn: {
          title: "Warning",
          hint: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 9v4m0 4h.01M8.681 4.082C9.351 2.797 10.621 2 12 2s2.649.797 3.319 2.082l6.203 11.904a4.28 4.28 0 0 1-.046 4.019C20.793 21.241 19.549 22 18.203 22H5.797c-1.346 0-2.59-.759-3.273-1.995a4.28 4.28 0 0 1-.046-4.019L8.681 4.082Z"/></svg>`,
        },
        deter: {
          title: "Danger",
          hint: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 12s-5.6 4.6-3.6 8c1.6 2.6 5.7 2.7 7.2 0 2-3.7-3.6-8-3.6-8Z"/><path d="M13.004 2 8.5 9 6.001 6s-4.268 7.206-1.629 11.8c3.016 5.5 11.964 5.7 15.08 0C23.876 10 13.004 2 13.004 2Z"/></svg>`,
        },
        assert: {
          title: "Info",
          hint: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12.5 7.5h.01m-.01 4v4m-7.926.685L2 21l6.136-1.949c1.307.606 2.791.949 4.364.949 5.243 0 9.5-3.809 9.5-8.5S17.743 3 12.5 3 3 6.809 3 11.5c0 1.731.579 3.341 1.574 4.685"/></svg>`,
        },
      },
    })

  // Apply custom middleware if provided
  if (applyMiddleware) {
    pipeline = applyMiddleware(pipeline)
  }

  pipeline = pipeline
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })

  const tree = pipeline.parse(content)

  const hastTree = pipeline.runSync(tree, content)

  return {
    content: toJsxRuntime(hastTree, {
      Fragment,
      ignoreInvalidStyle: true,
      jsx: (type, props, key) => jsx(type as any, props, key),
      jsxs: (type, props, key) => jsxs(type as any, props, key),
      passNode: true,
      components,
    }),
  }
}
