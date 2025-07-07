import { useWhoami } from "@client/atoms/user"
import { Avatar, AvatarFallback, AvatarImage } from "@follow/components/ui/avatar/index.jsx"
import { getBackgroundGradient } from "@follow/utils/color"
import { cn } from "@follow/utils/utils"
import { useMemo } from "react"

export const UserAvatar = ({ className }: { className?: string }) => {
  let user = useWhoami()

  const colors = useMemo(
    () => getBackgroundGradient(user?.name || user?.image || ""),
    [user?.name, user?.image],
  )
  const colorfulStyle: React.CSSProperties = useMemo(() => {
    const [, , , bgAccent, bgAccentLight, bgAccentUltraLight] = colors
    return {
      // Create a bottom-left to top-right avatar fallback background gradient
      backgroundImage: `linear-gradient(to top right, ${bgAccent} 20%, ${bgAccentLight} 90%, ${bgAccentUltraLight} 150%)`,
    }
  }, [colors])

  if (!user) {
    if (import.meta.env.DEV) {
      user = {
        id: "1",
        name: "Innei",
        image: "https://avatars-githubusercontent-webp.webp.se/u/41265413?v=4",
        handle: "innei",
        deleted: false,
      }
    } else {
      return null
    }
  }
  const { name, image } = user

  return (
    <div
      className={cn(
        "text-text-secondary flex h-20 items-center justify-center gap-8 px-10 py-4 text-2xl font-medium",
        className,
      )}
    >
      <Avatar className="border">
        <AvatarImage
          className="animate-in fade-in-0 aspect-square size-full duration-200"
          src={image!}
        />
        <AvatarFallback style={colorfulStyle} className="text-sm">
          {name?.slice(0, 2)}
        </AvatarFallback>
      </Avatar>

      <div className="text-text truncate">{name}</div>
    </div>
  )
}
