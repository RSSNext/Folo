# Contributing to Folo

Thank you for considering contributing to Folo! We welcome contributions from the community to help improve and expand the project.

## Getting Started

Before you start contributing, please ensure you have enabled [Corepack](https://nodejs.org/api/corepack.html). Corepack ensures you are using the correct version of the package manager specified in the `package.json`.

```sh
corepack enable && corepack prepare
```

### Installing Dependencies

To install the necessary dependencies, run:

```sh
pnpm install
```

## Development Setup

### Develop in the Browser

For a more convenient development experience, we recommend developing in the browser:

```sh
cd apps/desktop && pnpm run dev:web
```

This will open the browser at `https://app.folo.is/__debug_proxy`, allowing you to access the online API environment for development and debugging.

### Develop in Electron

If you prefer to develop in Electron, follow these steps:

0. Go to the `apps/desktop` directory:

   ```sh
   cd apps/desktop
   ```

1. Copy the example environment variables file:

   ```sh
   cp .env.example .env
   ```

2. Set `VITE_API_URL` to `https://api.follow.is` in your `.env` file.

3. Run the development server:

   ```sh
   pnpm run dev:electron
   ```

> **Tip:** If you encounter login issues, copy the `__Secure-better-auth.session_token` from your browser's cookies into the app.

### Develop in External SSR Web App

To develop in SSR, follow these steps:

1. Go to the `apps/ssr` directory:

   ```sh
   cd apps/ssr
   ```

2. Run the development server:

   ```sh
   pnpm run dev
   ```

### Develop in Mobile App

To develop in the mobile app, follow these steps:

> [!NOTE]
> You need to have a Mac device to develop in the mobile app.
>
> And already installed Xcode and the necessary dependencies.

1. Go to the `apps/mobile` directory:

   ```sh
   cd apps/mobile
   ```

2. Copy the example environment variables file:

   ```sh
   cp .env.example .env
   ```

   Then set the required environment variables in your `.env` file:

   ```sh
   echo 'EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN="xxx"' >> .env
   ```

   Or manually edit the `.env` file to add:

   ```
   EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN="xxx"
   ```

   the value is any string.

3. Build and install Folo(dev) app from source: (This step will take a while and only need to be done once)

   ```sh
   pnpm expo prebuild --clean # Optional
   pnpm run ios
   ```

4. Run the development server:

   ```sh
   pnpm run dev
   ```

#### Development Native Modules

To develop native iOS modules, follow these steps:

1. Go to the `apps/mobile` directory:

   ```sh
   cd apps/mobile/ios
   ```

2. Open project in Xcode:

   ```sh
   open Folo.xcworkspace
   ```

3. Open `Pods` in left sidebar and select `FollowNative`:

![](https://github.com/user-attachments/assets/a449c087-6d55-4cbd-bc4b-c61a08406e98)

4. Build and run the project.

## Contribution Guidelines

- Ensure your code follows the project's coding standards and conventions.
- Write clear, concise commit messages.
- Include relevant tests for your changes.
- Update documentation as necessary.

## Community

Join our community to discuss ideas, ask questions, and share your contributions:

- [Discord](https://discord.gg/followapp)
- [Twitter](https://x.com/intent/follow?screen_name=folo_is)

We look forward to your contributions!

## License

By contributing to Folo, you agree that your contributions will be licensed under the GNU General Public License version 3, with the special exceptions noted in the `README.md`.
