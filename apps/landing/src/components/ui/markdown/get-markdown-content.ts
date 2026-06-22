import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

import privacyPolicyMarkdown from '~/legal/privacy.md?raw'
import termsOfServiceMarkdown from '~/legal/tos.md?raw'

const markdownContentByPath = {
  'legal/privacy.md': privacyPolicyMarkdown,
  'legal/tos.md': termsOfServiceMarkdown,
} as const

export type MarkdownFilePath = keyof typeof markdownContentByPath

export async function getMarkdownContent(filePath: MarkdownFilePath) {
  try {
    const fileContents = markdownContentByPath[filePath]

    const processedContent = await unified()
      .use(remarkParse)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(fileContents)

    return {
      content: processedContent.toString(),
    }
  } catch (error) {
    console.error('Error reading markdown file:', error)
    return {
      content: '<p>Error loading content. Please try again later.</p>',
    }
  }
}
