export type OS = 'iOS' | 'Android' | 'macOS' | 'Windows' | 'Linux'

export type PlatformDownloadChannel = {
  id: string
  href: string
  name: string
  description: string
}

export type PlatformDownloadGroup = {
  os: OS
  label: string
  icon: string
  channels: PlatformDownloadChannel[]
}

const OTA_DOWNLOAD_URL = 'https://ota.folo.is/download'

export const DEFAULT_RELEASE_DOWNLOAD_LINKS = {
  androidApk: `${OTA_DOWNLOAD_URL}/mobile/android/apk`,
  linuxAppImage: `${OTA_DOWNLOAD_URL}/desktop/linux/appimage`,
  macosDmg: `${OTA_DOWNLOAD_URL}/desktop/macos/dmg`,
  macosDmgX64: `${OTA_DOWNLOAD_URL}/desktop/macos/dmg-x64`,
  windowsExe: `${OTA_DOWNLOAD_URL}/desktop/windows/exe`,
} as const

export const PlatformDownloadGroups: PlatformDownloadGroup[] = [
  {
    os: 'iOS',
    label: 'iOS',
    icon: 'i-simple-icons-apple',
    channels: [
      {
        id: 'ios-app-store',
        href: 'https://apps.apple.com/us/app/folo-follow-everything/id6739802604',
        name: 'App Store',
        description: 'Install on iPhone and iPad',
      },
    ],
  },
  {
    os: 'Android',
    label: 'Android',
    icon: 'i-simple-icons-googleplay',
    channels: [
      {
        id: 'android-google-play',
        href: 'https://play.google.com/store/apps/details?id=is.follow',
        name: 'Google Play',
        description: 'Automatic updates',
      },
      {
        id: 'android-apk',
        href: DEFAULT_RELEASE_DOWNLOAD_LINKS.androidApk,
        name: 'Direct Download (APK)',
        description: 'Download the latest APK',
      },
    ],
  },
  {
    os: 'macOS',
    label: 'macOS',
    icon: 'i-simple-icons-apple',
    channels: [
      {
        id: 'macos-app-store',
        href: 'https://apps.apple.com/us/app/folo-follow-everything/id6739802604',
        name: 'Mac App Store',
        description: 'Automatic updates',
      },
      // Browsers don't tell an Intel Mac from an Apple Silicon one, so both builds are offered
      {
        id: 'macos-dmg',
        href: DEFAULT_RELEASE_DOWNLOAD_LINKS.macosDmg,
        name: 'Direct Download (Apple Silicon)',
        description: 'DMG for Macs with M-series chips',
      },
      {
        id: 'macos-dmg-x64',
        href: DEFAULT_RELEASE_DOWNLOAD_LINKS.macosDmgX64,
        name: 'Direct Download (Intel)',
        description: 'DMG for Macs with Intel processors',
      },
    ],
  },
  {
    os: 'Windows',
    label: 'Windows',
    icon: 'i-simple-icons-windows',
    channels: [
      {
        id: 'windows-store',
        href: 'https://apps.microsoft.com/detail/9nvfzpv0v0ht?mode=direct',
        name: 'Microsoft Store',
        description: 'Automatic updates',
      },
      {
        id: 'windows-exe',
        href: DEFAULT_RELEASE_DOWNLOAD_LINKS.windowsExe,
        name: 'Direct Download (EXE)',
        description: 'Download the latest EXE',
      },
    ],
  },
  {
    os: 'Linux',
    label: 'Linux',
    icon: 'i-simple-icons-linux',
    channels: [
      {
        id: 'linux-appimage',
        href: DEFAULT_RELEASE_DOWNLOAD_LINKS.linuxAppImage,
        name: 'Direct Download (AppImage)',
        description: 'Download the latest AppImage',
      },
    ],
  },
]
