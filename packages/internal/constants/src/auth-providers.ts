export const authProvidersConfig = {
  google: {
    buttonClassName:
      "bg-blue-500 hover:!bg-blue-500/90 focus:!border-blue-500/80 focus:!ring-blue-500/80",
    iconClassName: "i-mgc-google-cute-fi",
  },
  github: {
    buttonClassName: "bg-black hover:!bg-black/90 focus:!border-black/80 focus:!ring-black/80",
    iconClassName: "i-mgc-github-cute-fi",
  },
  apple: {
    buttonClassName:
      "bg-gray-800 hover:!bg-gray-800/90 focus:!border-gray-800/80 focus:!ring-gray-800/80",
    iconClassName: "i-mgc-apple-cute-fi",
  },
} as Record<
  string,
  {
    buttonClassName: string
    iconClassName: string
  }
>
