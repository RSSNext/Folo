import { cn } from "@follow/utils"
import { useMemo, useState } from "react"
import { View } from "react-native"

import { FallbackIcon } from "@/src/components/ui/icon/fallback-icon"
import { Image } from "@/src/components/ui/image/Image"
import type { ActivePlayable } from "@/src/lib/player"

/**
 * Artwork of what is playing, loaded through the image proxy like the entry list. Without
 * artwork, or when it can't be loaded, it shows the letter avatar that feed icons fall back to
 * instead of an empty box.
 */
export function PlayerArtwork({
  playable,
  size,
  className,
}: {
  playable: Pick<ActivePlayable, "artist" | "artwork" | "title"> | null
  /** Size on screen in points, used for the proxied image and the avatar text */
  size: number
  className?: string
}) {
  const artwork = playable?.artwork
  const [failedArtwork, setFailedArtwork] = useState<string | null>(null)
  const source = useMemo(() => (artwork ? { uri: artwork } : undefined), [artwork])
  const proxy = useMemo(() => ({ width: size, height: size }), [size])
  const textStyle = useMemo(() => ({ fontSize: Math.round(size / 3) }), [size])

  if (!artwork || artwork === failedArtwork) {
    return (
      <View className={cn("overflow-hidden", className)}>
        <FallbackIcon
          title={playable?.artist || playable?.title || ""}
          size="100%"
          textStyle={textStyle}
        />
      </View>
    )
  }

  return (
    <Image
      source={source}
      proxy={proxy}
      className={className}
      onError={() => setFailedArtwork(artwork)}
    />
  )
}
