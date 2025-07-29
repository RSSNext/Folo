import { replaceImgUrlIfNeed } from "@follow/utils/img-proxy"
import { cn } from "@follow/utils/utils"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import * as React from "react"

export const Avatar = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
  ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Root> | null>
}) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex size-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
)
Avatar.displayName = AvatarPrimitive.Root.displayName

export const AvatarImage = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & {
  ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Image> | null>
}) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square size-full", className)}
    src={replaceImgUrlIfNeed({ url: props.src })}
    {...props}
  />
)
AvatarImage.displayName = AvatarPrimitive.Image.displayName

export const AvatarFallback = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
  ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Fallback> | null>
}) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "bg-material-opaque flex size-full items-center justify-center rounded-full",
      className,
    )}
    {...props}
  />
)
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName
