import { describe, expect, it } from 'vitest'

import { PlatformDownloadGroups } from './download'

const findChannel = (id: string) => {
  const channel = PlatformDownloadGroups.flatMap(
    (group) => group.channels,
  ).find((item) => item.id === id)

  if (!channel) {
    throw new Error(`Missing download channel: ${id}`)
  }

  return channel
}

describe('PlatformDownloadGroups', () => {
  it('uses the APK asset for Android direct downloads', () => {
    expect(findChannel('android-apk').href).toBe(
      'https://ota.folo.is/download/mobile/android/apk',
    )
  })

  it('uses desktop installer assets for desktop direct downloads', () => {
    expect(findChannel('macos-dmg').href).toBe(
      'https://ota.folo.is/download/desktop/macos/dmg',
    )
    expect(findChannel('macos-dmg-x64').href).toBe(
      'https://ota.folo.is/download/desktop/macos/dmg-x64',
    )
    expect(findChannel('windows-exe').href).toBe(
      'https://ota.folo.is/download/desktop/windows/exe',
    )
    expect(findChannel('linux-appimage').href).toBe(
      'https://ota.folo.is/download/desktop/linux/appimage',
    )
  })
})
