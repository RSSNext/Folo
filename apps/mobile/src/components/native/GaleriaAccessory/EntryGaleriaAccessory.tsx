import { requireNativeModule } from "expo"

const FollowGaleriaAccessory = requireNativeModule<{
  showEntryGaleriaAccessory: (props: {
    author: string
    avatarUrl: string
    publishedAt: string
  }) => void
}>("FollowGaleriaAccessory")

/**
 * @deprecated Use `const { openLightbox } = useLightboxControls()` instead.
 */
export const showEntryGaleriaAccessory = (props: {
  author: string
  avatarUrl: string
  publishedAt: string
}) => {
  FollowGaleriaAccessory.showEntryGaleriaAccessory(props)
}
