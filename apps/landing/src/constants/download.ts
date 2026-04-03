import { siteInfo } from './site'

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
        href: siteInfo.releaseLink,
        name: 'Direct Download (APK)',
        description: 'Install from the latest GitHub release',
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
      {
        id: 'macos-dmg',
        href: siteInfo.releaseLink,
        name: 'Direct Download (DMG)',
        description: 'Install from the latest GitHub release',
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
        href: siteInfo.releaseLink,
        name: 'Direct Download (EXE)',
        description: 'Install from the latest GitHub release',
      },
    ],
  },
  {
    os: 'Linux',
    label: 'Linux',
    icon: 'i-simple-icons-linux',
    channels: [
      {
        id: 'linux-github',
        href: siteInfo.releaseLink,
        name: 'GitHub Release',
        description: 'AppImage and other release assets',
      },
    ],
  },
]
