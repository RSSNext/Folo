import type { Metadata } from 'next/types'

import { getMarkdownContent, MarkdownContent } from '~/components/ui/markdown'
import { siteInfo } from '~/constants/site'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    "Read Folo's terms of service to understand the rules and guidelines for using our next-generation information browser platform.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    ...siteInfo.seo.openGraph,
    title: 'Terms of Service - Folo',
    description: "Read Folo's terms of service and usage guidelines.",
    url: `${siteInfo.webUrl}/terms-of-service`,
  },
  twitter: {
    ...siteInfo.seo.twitter,
    title: 'Terms of Service - Folo',
    description: "Read Folo's terms of service and usage guidelines.",
  },
  alternates: {
    canonical: '/terms-of-service',
  },
}

export default async function TermsOfServicePage() {
  const { content } = await getMarkdownContent('legal/tos.md')

  return <MarkdownContent content={content} />
}
