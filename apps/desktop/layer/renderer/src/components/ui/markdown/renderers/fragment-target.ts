// The HTML sanitizer prefixes ids to keep them from clobbering the app's own. Entry content goes
// through it on the server and again in the client, so the prefix may repeat, while links in
// the content still point at the original ids.
const SANITIZER_ID_PREFIX = "user-content-"

const stripSanitizerPrefix = (id: string) => {
  let value = id
  while (value.startsWith(SANITIZER_ID_PREFIX)) {
    value = value.slice(SANITIZER_ID_PREFIX.length)
  }
  return value
}

const decodeFragment = (fragment: string) => {
  try {
    return decodeURIComponent(fragment)
  } catch {
    return fragment
  }
}

export const isFragmentLink = (href: string | undefined): href is `#${string}` =>
  !!href?.startsWith("#")

/** The element in rendered content that an in-page link like `#section-2` points at */
export const findFragmentTarget = (container: ParentNode, href: string): HTMLElement | null => {
  const wanted = stripSanitizerPrefix(decodeFragment(href.slice(1)))
  if (!wanted) return null

  for (const element of container.querySelectorAll<HTMLElement>("[id]")) {
    if (stripSanitizerPrefix(element.id) === wanted) return element
  }
  return null
}
