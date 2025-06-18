import type { FeedViewType } from "@follow/constants"
import type { FeedSchema } from "@follow/database/schemas/types"
import { cn } from "@follow/utils"
import type { ReactNode } from "react"
import { useCallback, useMemo, useState } from "react"

import { getFeedIconSource } from "@/src/lib/image"

import type { ImageProps } from "../image/Image"
import { Image } from "../image/Image"
import { FallbackIcon } from "./fallback-icon"

export type FeedIconRequiredFeed = Pick<
  FeedSchema,
  "ownerUserId" | "id" | "title" | "url" | "image"
> & {
  type: FeedViewType
  siteUrl?: string
}
export type FeedIconFeed = FeedIconRequiredFeed | FeedSchema

interface FeedIconProps {
  feed?: FeedIconFeed
  fallbackUrl?: string
  className?: string
  size?: number
  siteUrl?: string
  /**
   * Image loading error fallback to site icon
   */
  fallback?: boolean
  fallbackElement?: ReactNode
}
export function FeedIcon({
  feed,
  fallbackUrl,
  className,
  size = 20,
  fallback,
  fallbackElement,
  siteUrl,
  ...props
}: FeedIconProps & ImageProps) {
  const [isError, setIsError] = useState(false)
  const src = useMemo(() => {
    return getFeedIconSource(feed, siteUrl, fallback)
  }, [fallback, feed, siteUrl])

  const handleError = useCallback(() => setIsError(true), [])

  if (!src || isError) {
    return (
      <FallbackIcon title={feed?.title ?? ""} size={size} className={cn("rounded", className)} />
    )
  }
  return (
    <Image
      proxy={{
        width: size,
        height: size,
      }}
      className={cn("rounded", className)}
      style={{ height: size, width: size }}
      source={{ uri: src }}
      onError={handleError}
      {...props}
    />
  )
}
