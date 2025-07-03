# Folo Mobile App 📱

This is the mobile client for [Folo](https://app.folo.is), built with [Expo](https://expo.dev). Folo organizes content into one timeline, keeping you updated on what matters, noise-free.

## Features

- Customized information hub for content discovery
- AI-powered features like translation and summary
- Dynamic content support (articles, videos, images, audio)
- $POWER integration for creator economy
- Cross-platform support (iOS & Android [WIP])
- Modern UI design with native feel

## Getting Started

1. Enable Corepack (if not already enabled)

   ```bash
   corepack enable
   ```

2. Install dependencies

   ```bash
   pnpm install
   ```

3. Start the development server
   ```bash
   pnpm run dev
   ```

You can run the app on:

- iOS Simulator (`pnpm run ios`)
- iOS Device (`pnpm run ios:device`)
- Android Emulator (`pnpm run android`)
- Development build for full native feature testing

## Project Structure

```
src/
├── modules/         # Feature-specific modules
│   ├── discover/    # Discovery feed features
│   └── ...
├── screens/         # App screens using file-based routing
└── ...
```

## Development

- Built with Expo SDK [>=52]
- Uses [Expo Router](https://docs.expo.dev/router/introduction/) for navigation
- Styling with [NativeWind](https://www.nativewind.dev/)
- State management with Jotai and Zustand
- API integration with Tanstack Query
- Full TypeScript support

## Useful Resources

- [Expo Documentation](https://docs.expo.dev/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [Main Project Repository](https://github.com/RSSNext/Follow)

## Need Help?

- Join our [Discord](https://discord.gg/followapp)
- Follow us on [Twitter](https://x.com/follow_app_)
- Contact the mobile development team

## License

This project is licensed under the GNU General Public License version 3. See the main project repository for full license details.
