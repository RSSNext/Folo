import { NextResponse } from 'next/server'

import { defaultLocale, locales } from '~/i18n/routing'

const localeSet = new Set(locales)
const rscSuffix = '.rsc'
const bypassPrefixes = ['/_next', '/_vinext', '/api']
const bypassExactPaths = new Set([
  '/apple-app-site-association',
  '/.well-known/apple-app-site-association',
  '/discover-sources',
])

const getLogicalPathname = (pathname: string) => {
  if (!pathname.endsWith(rscSuffix)) {
    return pathname
  }

  const logicalPathname = pathname.slice(0, -rscSuffix.length)
  return logicalPathname === '' ? '/' : logicalPathname
}

export function proxy(request: Request) {
  const url = new URL(request.url)
  const rawPathname = url.pathname
  const pathname = getLogicalPathname(rawPathname)

  if (bypassPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  if (bypassExactPaths.has(pathname)) {
    return NextResponse.next()
  }

  const hasFileExtension = /\.[^/]+$/.test(rawPathname)
  if (hasFileExtension && !rawPathname.endsWith(rscSuffix)) {
    return NextResponse.next()
  }

  const firstSegment = pathname.split('/').find(Boolean)
  if (firstSegment && localeSet.has(firstSegment as (typeof locales)[number])) {
    return NextResponse.next()
  }

  const rewritePath =
    pathname === '/' ? `/${defaultLocale}` : `/${defaultLocale}${pathname}`
  const rewriteUrl = new URL(rewritePath, request.url)
  rewriteUrl.search = url.search

  return NextResponse.rewrite(rewriteUrl)
}

export const middleware = proxy
export default proxy

export const config = {
  matcher: ['/:path*'],
}
