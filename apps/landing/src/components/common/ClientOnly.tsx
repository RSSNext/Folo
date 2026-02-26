'use client'

import { useIsClient } from '~/hooks/common/use-is-client'

export const ClientOnly: Component = (props) => {
  const isClient = useIsClient()
  if (!isClient) return null
  return <>{props.children}</>
}
