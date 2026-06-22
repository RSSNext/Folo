import { describe, expect, it } from 'vitest'

import { getMarkdownContent } from './get-markdown-content'

describe('getMarkdownContent', () => {
  it('renders the privacy policy markdown content', async () => {
    const { content } = await getMarkdownContent('legal/privacy.md')

    expect(content).toContain('<h1>Privacy Policy</h1>')
    expect(content).not.toContain('Error loading content')
  })

  it('renders the terms of service markdown content', async () => {
    const { content } = await getMarkdownContent('legal/tos.md')

    expect(content).toContain('<h1>Terms of Service</h1>')
    expect(content).not.toContain('Error loading content')
  })
})
