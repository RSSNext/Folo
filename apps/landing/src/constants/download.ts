type OS = 'macOS' | 'Windows' | 'Linux'
export const PlatformStoreLinkMap = {
  // iOS: {
  //   link: 'https://apps.apple.com/us/app/folo-follow-everything/id6739802604',
  //   name: 'App Store',
  // },
  macOS: {
    link: 'https://apps.apple.com/us/app/folo-follow-everything/id6739802604',
    name: 'Mac App Store',
  },
  Windows: {
    link: 'https://apps.microsoft.com/detail/9nvfzpv0v0ht?mode=direct',
    name: 'Microsoft Store',
  },
  Linux: {
    link: 'https://github.com/RSSNext/Folo/releases/latest',
    name: 'GitHub',
  },
  // Android: {
  //   link: 'https://play.google.com/store/apps/details?id=is.follow',
  //   name: 'Google Play',
  // },
} satisfies Record<OS, { link: string; name: string } | undefined>
