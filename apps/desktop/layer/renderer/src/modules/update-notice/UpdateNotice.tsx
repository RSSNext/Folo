import { Spring } from "@follow/components/constants/spring.js"
import { tracker } from "@follow/tracker"
import { cn } from "@follow/utils/utils"
import { m, useMotionTemplate, useMotionValue } from "motion/react"
import { useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"

import { useAudioPlayerAtomSelector } from "~/atoms/player"
import { getUpdaterStatus, setUpdaterStatus, useUpdaterStatus } from "~/atoms/updater"
import { ipcServices } from "~/lib/client"

export const UpdateNotice = () => {
  const updaterStatus = useUpdaterStatus()
  const { t } = useTranslation()

  const handleClick = useRef(() => {
    const status = getUpdaterStatus()
    if (!status) return
    tracker.updateRestart({
      type: status.type,
    })
    switch (status.type) {
      case "app": {
        ipcServices?.app.quitAndInstall()
        break
      }
      case "renderer": {
        ipcServices?.app.rendererUpdateReload()
        break
      }
      case "pwa": {
        status.finishUpdate?.()
        break
      }
    }
    setUpdaterStatus(null)
  }).current

  const playerIsShow = useAudioPlayerAtomSelector((s) => s.show)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const radius = useMotionValue(0)
  const handleMouseMove = useCallback(
    ({ clientX, clientY, currentTarget }: React.MouseEvent) => {
      const bounds = currentTarget.getBoundingClientRect()
      mouseX.set(clientX - bounds.left)
      mouseY.set(clientY - bounds.top)
      radius.set(Math.hypot(bounds.width, bounds.height) * 1.3)
    },
    [mouseX, mouseY, radius],
  )

  const background = useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, hsl(var(--fo-a)) 0%, transparent 65%)`

  if (!updaterStatus) return null

  return (
    <m.div
      onMouseMove={handleMouseMove}
      className={cn(
        "bg-background/80 macos:bg-background backdrop-blur-background group absolute inset-x-3 cursor-pointer overflow-hidden rounded-lg py-3 text-center text-sm shadow",
        playerIsShow ? "bottom-[4.5rem]" : "bottom-3",
      )}
      onClick={handleClick}
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={Spring.presets.softBounce}
    >
      <m.div
        layout
        className="absolute inset-0 opacity-0 duration-500 group-hover:opacity-5"
        style={
          {
            background,
          } as any
        }
      />
      <div className="font-medium">{t("notify.update_info", { app_name: APP_NAME })}</div>
      <div className="text-xs text-zinc-500">
        {updaterStatus.type === "app" ? t("notify.update_info_1") : t("notify.update_info_2")}
      </div>
    </m.div>
  )
}
