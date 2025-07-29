import { useLongPress } from "@follow/hooks"

interface UseContextMenuOptions {
  onContextMenu: (e: React.MouseEvent) => void
  onTouchStart?: (e: React.TouchEvent) => void
  onTouchMove?: (e: React.TouchEvent) => void
  onTouchEnd?: (e: React.TouchEvent) => void
}

export const useContextMenu = ({
  onContextMenu,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: UseContextMenuOptions) => {
  const props = useLongPress({
    onLongPress: onContextMenu as any,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  })
  return {
    ...props,
    onContextMenu,
  }
}
