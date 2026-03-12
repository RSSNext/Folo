/**
 * @see https://github.com/Ephibbs/flowtoken/blob/main/src/components/AnimatedMarkdown.tsx
 */

import * as React from 'react'
import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkEmoji from 'remark-emoji'

import { ANIMATION_STYLE as ANIMATION_STYLE_DEFAULT } from './constants'
import { TokenizedText } from './TokenizedText'

interface MarkdownAnimateTextProps {
  content: string
  isStreaming?: boolean
}

const emptyObject = {}
const animateText: (text: string | Array<any>) => React.ReactNode = (
  text: string | Array<any>,
) => {
  text = Array.isArray(text) ? text : [text]
  let keyCounter = 0
  const processText: (input: any, keyPrefix?: string) => React.ReactNode = (
    input: any,
    keyPrefix = 'item',
  ) => {
    if (Array.isArray(input)) {
      // Process each element in the array
      return input.map((element, index) => (
        <React.Fragment key={`${keyPrefix}-${index}`}>
          {processText(element, `${keyPrefix}-${index}`)}
        </React.Fragment>
      ))
    } else if (typeof input === 'string') {
      return <TokenizedText key={`pcc-${keyCounter++}`} input={input} />
    } else if (typeof input === 'number') {
      return <TokenizedText key={`pcc-${keyCounter++}`} input={String(input)} />
    } else if (React.isValidElement(input)) {
      // Preserve element structure and do not wrap block elements (avoid <span><ul>...)
      return React.cloneElement(input as React.ReactElement, {
        key: `pcc-${keyCounter++}`,
      })
    } else {
      // Return other inputs unchanged (null, undefined, booleans, etc.)
      return input
    }
  }

  return processText(text)
}

const createAiMessageMarkdownElementsRender = (canAnimate: boolean) => {
  const ANIMATION_STYLE = canAnimate ? ANIMATION_STYLE_DEFAULT : emptyObject

  const textAnimator = canAnimate
    ? animateText
    : (text: string | Array<any>) => text

  return {
    // Folo Special Tags
    'mention-entry': () => null,
    'mention-feed': () => null,

    text: ({ node, ...props }: any) => (
      <span {...props}>{textAnimator(props.children)}</span>
    ),
    h1: ({ node, ...props }: any) => (
      <h1 {...props}>{textAnimator(props.children)}</h1>
    ),
    h2: ({ node, ...props }: any) => (
      <h2 {...props}>{textAnimator(props.children)}</h2>
    ),
    h3: ({ node, ...props }: any) => (
      <h3 {...props}>{textAnimator(props.children)}</h3>
    ),
    h4: ({ node, ...props }: any) => (
      <h4 {...props}>{textAnimator(props.children)}</h4>
    ),
    h5: ({ node, ...props }: any) => (
      <h5 {...props}>{textAnimator(props.children)}</h5>
    ),
    h6: ({ node, ...props }: any) => (
      <h6 {...props}>{textAnimator(props.children)}</h6>
    ),
    p: ({ node, ...props }: any) => (
      <p {...props}>{textAnimator(props.children)}</p>
    ),
    li: ({ node, ...props }: any) => (
      <li {...props} style={ANIMATION_STYLE}>
        {textAnimator(props.children)}
      </li>
    ),

    strong: ({ node, ...props }: any) => (
      <strong {...props}>{textAnimator(props.children)}</strong>
    ),
    em: ({ node, ...props }: any) => (
      <em {...props}>{textAnimator(props.children)}</em>
    ),

    hr: ({ node, ...props }: any) => (
      <hr {...props} className="whitespace-pre-wrap" style={ANIMATION_STYLE} />
    ),

    table: ({ children, ref, node, ...props }) => {
      return (
        <div className="border-border bg-material-thin overflow-x-auto rounded-lg border">
          <table
            {...props}
            style={ANIMATION_STYLE}
            className="divide-border my-0 min-w-full divide-y text-sm"
          >
            {children}
          </table>
        </div>
      )
    },
    thead: ({ children, ref, node, ...props }) => {
      return (
        <thead {...props} className="bg-fill-tertiary">
          {children}
        </thead>
      )
    },
    th: ({ children, ref, node, ...props }) => {
      return (
        <th
          {...props}
          className="text-text-secondary whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
        >
          {children}
        </th>
      )
    },
    tbody: ({ children, ref, node, ...props }) => {
      return (
        <tbody
          {...props}
          className="bg-material-ultra-thin divide-border divide-y"
        >
          {children}
        </tbody>
      )
    },
    tr: ({ children, ref, node, ...props }) => {
      return (
        <tr
          {...props}
          className="hover:bg-material-thin transition-colors duration-150"
        >
          {textAnimator(children as any)}
        </tr>
      )
    },
    td: ({ children, ref, node, ...props }) => {
      return (
        <td
          {...props}
          className="text-text whitespace-nowrap px-4 py-3 text-sm"
        >
          {textAnimator(children as any)}
        </td>
      )
    },
  } as Components
}

const animatedComponents = createAiMessageMarkdownElementsRender(true)
const staticComponents = createAiMessageMarkdownElementsRender(false)
export const MarkdownAnimateText: React.FC<MarkdownAnimateTextProps> = ({
  content,
  isStreaming,
}) => {
  const components = isStreaming ? animatedComponents : staticComponents

  return (
    <ReactMarkdown components={components} remarkPlugins={[remarkEmoji]}>
      {content}
    </ReactMarkdown>
  )
}
