import type { ConfigContext, ExpoConfig } from "expo/config"
import { resolve } from "pathe"

const PKG = require("./package.json") as typeof import("./package.json")

// const roundedIconPath = resolve(__dirname, "../../resources/icon.png")
const iconPathMap = {
  production: resolve(__dirname, "./assets/icon.png"),
  development: resolve(__dirname, "./assets/icon-dev.png"),
  "ios-simulator": resolve(__dirname, "./assets/icon-dev.png"),
  preview: resolve(__dirname, "./assets/icon-staging.png"),
} as Record<string, string>
const iconPath = iconPathMap[process.env.PROFILE || "production"] || iconPathMap.production

const adaptiveIconPath = resolve(__dirname, "./assets/adaptive-icon.png")
const splashIconPath = resolve(__dirname, "./assets/splash-icon.png")

const isDev = process.env.NODE_ENV === "development"
const channelNameMap = {
  development: "development",
  "ios-simulator": "development",
  preview: "preview",
  "e2e-android": "preview",
  "e2e-ios-simulator": "preview",
  production: "production",
} as Record<string, string>

export default ({ config }: ConfigContext): ExpoConfig => {
  const profile = process.env.PROFILE || "production"
  const channelName = channelNameMap[profile] || channelNameMap.production

  const result: ExpoConfig = {
    ...config,

    extra: {
      eas: {
        projectId: "a6335b14-fb84-45aa-ba80-6f6ab8926920",
      },
      e2eEnvProfile: process.env.EXPO_PUBLIC_E2E_ENV_PROFILE ?? null,
      e2eLanguage: process.env.EXPO_PUBLIC_E2E_LANGUAGE ?? null,
    },
    owner: "follow",
    updates: {
      url: "https://ota.folo.is/manifest",
      requestHeaders: {
        "expo-channel-name": channelName,
      },
      codeSigningCertificate: "./code-signing/certificate.pem",
      codeSigningMetadata: {
        keyid: "main",
        alg: "rsa-v1_5-sha256",
      },
      checkAutomatically: "NEVER",
    },
    runtimeVersion: isDev ? "0.0.0-dev" : PKG.version,

    name: "Folo",
    slug: "follow",
    version: PKG.version,
    orientation: "portrait" as const,
    icon: iconPath,
    scheme: ["follow", "folo"],
    userInterfaceStyle: "automatic" as const,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "is.follow",
      usesAppleSignIn: true,
      infoPlist: {
        LSApplicationCategoryType: "public.app-category.news",
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ["audio"],
        LSApplicationQueriesSchemes: ["bilibili", "youtube"],
        CFBundleAllowMixedLocalizations: true,
        // apps/mobile/src/@types/constants.ts currentSupportedLanguages
        CFBundleLocalizations: ["en", "ja", "zh-CN", "zh-TW", "fr-FR"],
        CFBundleDevelopmentRegion: "en",
      },
      googleServicesFile: "./build/GoogleService-Info.plist",
    },
    android: {
      package: "is.follow",
      adaptiveIcon: {
        foregroundImage: adaptiveIconPath,
        monochromeImage: adaptiveIconPath,
        backgroundColor: "#FF5C00",
      },
      googleServicesFile: "./build/google-services.json",
    },
    // web: {
    //   bundler: "metro",
    //   output: "static",
    //   favicon: iconPath,
    // },
    plugins: [
      [
        "expo-document-picker",
        {
          iCloudContainerEnvironment: "Production",
        },
      ],
      "expo-localization",
      [
        "expo-splash-screen",
        {
          android: {
            image: splashIconPath,
            imageWidth: 200,
          },
        },
      ],
      [
        "expo-build-properties",
        {
          ios: {
            // Expo SDK 55 archive builds regress with use_frameworks + prebuilt RN core.
            buildReactNativeFromSource: true,
            useFrameworks: "static",
            forceStaticLinking: ["RNFBApp", "RNFBAnalytics", "RNFBMessaging", "RNFBAppCheck"],
          },
        },
      ],
      "expo-sqlite",
      [
        "expo-media-library",
        {
          photosPermission: "Allow $(PRODUCT_NAME) to access your photos.",
          savePhotosPermission: "Allow $(PRODUCT_NAME) to save photos.",
          isAccessMediaLocationEnabled: true,
        },
      ],
      "expo-apple-authentication",
      "expo-web-browser",
      "expo-image",
      "expo-sharing",
      [
        "expo-video",
        {
          supportsBackgroundPlayback: true,
          supportsPictureInPicture: true,
        },
      ],
      [
        require("./plugins/with-follow-assets.js"),
        {
          // Add asset directory paths, the plugin copies the files in the given paths to the app bundle folder named Assets
          assetsPath: resolve(__dirname, "..", "..", "out", "rn-web"),
        },
      ],
      require("./plugins/with-follow-ios-resources.js"),
      require("./plugins/with-rnfb-build-properties.js"),

      require("./plugins/with-gradle-jvm-heap-size-increase.js"),
      require("./plugins/with-android-jdk-21.js"),
      require("./plugins/with-android-manifest-plugin.js"),
      "expo-secure-store",
      "@react-native-firebase/app",
      [
        "expo-image-picker",
        {
          photosPermission: "Allow $(PRODUCT_NAME) to access your photos.",
        },
      ],
      [
        "expo-notifications",
        {
          enableBackgroundRemoteNotifications: true,
        },
      ],
      "expo-background-task",
    ],
  }

  if (process.env.PROFILE !== "production") {
    result.plugins ||= []
    result.plugins.push(require("./plugins/android-trust-user-certs.js"))
  }

  return result
}
