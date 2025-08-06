export const stopPropagation = <T extends { stopPropagation: () => any }>(e: T) =>
  e.stopPropagation()

export const preventDefault = <T extends { preventDefault: () => any }>(e: T) => e.preventDefault()

export const nextFrame = (fn: (...args: any[]) => any) => {
  let timer2: number | null = null
  const timer1 = requestAnimationFrame(() => {
    timer2 = requestAnimationFrame(() => {
      fn()
    })
  })
  return () => {
    if (timer1) cancelAnimationFrame(timer1)
    if (timer2) cancelAnimationFrame(timer2)
  }
}

export const getElementTop = (element: HTMLElement) => {
  let actualTop = element.offsetTop
  let current = element.offsetParent as HTMLElement
  while (current !== null) {
    actualTop += current.offsetTop
    current = current.offsetParent as HTMLElement
  }
  return actualTop
}

export const clearSelection = () => window.getSelection()?.removeAllRanges()

export const findElementInShadowDOM = (selector: string): HTMLElement | null => {
  const element = document.querySelector(selector)
  if (element) return element as HTMLElement

  // find in all shadow roots
  const getAllShadowRoots = (root: Document | Element | ShadowRoot): Element[] => {
    const hosts = Array.from(root.querySelectorAll("*")).filter((el) => el.shadowRoot)

    return hosts.reduce((acc, host) => {
      if (host.shadowRoot) {
        const shadowElement = host.shadowRoot.querySelector(selector)
        if (shadowElement) acc.push(shadowElement)
        return [...acc, ...getAllShadowRoots(host.shadowRoot)]
      }
      return acc
    }, [] as Element[])
  }

  const results = getAllShadowRoots(document)
  return (results[0] as HTMLElement) || null
}

export function composeEventHandlers<E>(
  originalEventHandler?: ((event: E) => void) | null,
  ourEventHandler?: ((event: E) => void) | null,
  { checkForDefaultPrevented = true } = {},
) {
  return function handleEvent(event: E) {
    originalEventHandler?.(event)

    if (checkForDefaultPrevented === false || !(event as unknown as Event).defaultPrevented) {
      return ourEventHandler?.(event)
    }
  }
}

export function getNodeXInScroller(node: Element, scroller: Element) {
  const nodeRect = node.getBoundingClientRect()
  const scrollerRect = scroller.getBoundingClientRect()
  return nodeRect.left - scrollerRect.left + scroller.scrollLeft
}
/**
 * Determines whether the node is visible in the horizontal scroll container
 */
export function isNodeVisibleInScroller(node: Element, scroller: Element) {
  const nodeRect = node.getBoundingClientRect()
  const scrollerRect = scroller.getBoundingClientRect()

  const nodeLeft = nodeRect.left - scrollerRect.left + scroller.scrollLeft
  const nodeRight = nodeLeft + nodeRect.width

  const scrollerLeft = scroller.scrollLeft
  const scrollerRight = scrollerLeft + scroller.clientWidth

  return nodeRight > scrollerLeft && nodeLeft < scrollerRight
}

export const checkIsEditableElement = (element: HTMLElement) => {
  return (
    element.isContentEditable ||
    element.getAttribute("contenteditable") === "true" ||
    (element instanceof HTMLInputElement && element.type === "text") ||
    element instanceof HTMLTextAreaElement
  )
}
