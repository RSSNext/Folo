import fs from 'node:fs'

import { join } from 'pathe'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

interface MarkdownContentProps {
  content: string
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="container">
      <div className="mx-auto max-w-4xl">
        {/* Content */}
        <div className="prose prose-lg prose-gray dark:prose-invert prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-orange-600 dark:prose-a:text-orange-400 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:text-orange-600 dark:prose-code:text-orange-400 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-blockquote:border-orange-300 dark:prose-blockquote:border-orange-600 prose-li:text-gray-700 dark:prose-li:text-gray-300 max-w-none">
          <div
            className="leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </div>
  )
}

// Utility function to read and process markdown files
export async function getMarkdownContent(filePath: string) {
  try {
    const fullPath = join(process.cwd(), 'src', filePath)
    const fileContents = fs.readFileSync(fullPath, 'utf8')

    // Process markdown to HTML using unified
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
