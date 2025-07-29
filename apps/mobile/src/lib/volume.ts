import { useCallback, useEffect, useState } from "react"
import { VolumeManager } from "react-native-volume-manager"

export const useVolume = () => {
  const [volume, setVolume] = useState<number | undefined>()

  const updateVolume = useCallback(async (newVolume: number) => {
    if (newVolume < 0 || newVolume > 1) return

    setVolume(newVolume)

    await VolumeManager.setVolume(newVolume)
  }, [])

  useEffect(() => {
    async function getVolume() {
      const result = await VolumeManager.getVolume()
      setVolume(result.volume)
    }

    getVolume()
  }, [])

  useEffect(() => {
    const volumeListener = VolumeManager.addVolumeListener((result) => {
      setVolume(result.volume)
    })

    // Remove the volume listener
    return () => {
      volumeListener.remove()
    }
  }, [])

  return { volume, updateVolume }
}
