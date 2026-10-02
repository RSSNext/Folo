import * as Slider from "@radix-ui/react-slider"
import type { FC } from "react"
import { useTranslation } from "react-i18next"

export const VolumeSlider: FC<{
  volume: number
  onVolumeChange: (volume: number) => void
}> = ({ onVolumeChange, volume }) => {
  const { t } = useTranslation()

  return (
    <Slider.Root
      className="relative flex h-16 w-1 flex-col items-center rounded p-1"
      max={1}
      step={0.01}
      orientation="vertical"
      value={[volume ?? 0.8]}
      onValueChange={(values) => {
        onVolumeChange?.(values[0]!)
      }}
    >
      <Slider.Track className="relative w-1 grow rounded bg-white dark:bg-neutral-800">
        <Slider.Range className="absolute w-full rounded bg-zinc-500/40 dark:bg-neutral-600" />
      </Slider.Track>

      {/* indicator */}
      <Slider.Thumb
        className="block size-3 rounded-full bg-zinc-500 dark:bg-zinc-400"
        aria-label={t("player.volume")}
      />
    </Slider.Root>
  )
}
