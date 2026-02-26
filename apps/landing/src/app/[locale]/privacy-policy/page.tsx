import type { Metadata } from 'next/types'

import { getMarkdownContent, MarkdownContent } from '~/components/ui/markdown'
import { siteInfo } from '~/constants/site'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    "Read Folo's privacy policy to understand how we collect, use, and protect your personal information when using our next-generation information browser.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    ...siteInfo.seo.openGraph,
    title: 'Privacy Policy - Folo',
    description:
      "Read Folo's privacy policy to understand how we protect your data and privacy.",
    url: `${siteInfo.webUrl}/privacy-policy`,
  },
  twitter: {
    ...siteInfo.seo.twitter,
    title: 'Privacy Policy - Folo',
    description:
      "Read Folo's privacy policy to understand how we protect your data and privacy.",
  },
  alternates: {
    canonical: '/privacy-policy',
  },
}

export default async function PrivacyPolicyPage() {
  const { content } = await getMarkdownContent('legal/privacy.md')

  return <MarkdownContent content={content} />
}
