# Contributing to Internationalization (i18n)

We welcome contributions to our internationalization efforts! This guide will help you get started with adding or updating translations for our project.

## Pay Attention

If it's a new language, please check for [existing issues](https://github.com/RSSNext/Follow/issues?q=sort%3Aupdated-desc+is%3Aissue+is%3Aopen+label%3Ai18n) before starting. If none exist, submit a new issue to avoid duplicating efforts.

## Adding a New Language

To add support for a new language:

1. Run the following command in the project root:

   ```bash
   npm run generator:i18n-template
   ```

2. Select the desired locale from the list.

3. The script will:
   - Create new resource files for the selected locale
   - Update the necessary configuration files

4. Open your editor and navigate to the `locales/` directory. You'll find new JSON files for the selected locale.

5. Translate the keys in these JSON files to the target language.

## Updating Existing Translations

To update or improve existing translations:

1. Navigate to the `locales/` directory.
2. Find the JSON files for the language you want to update.
3. Edit the translations as needed.

## Translation Guidelines

- Maintain the same structure and keys as the original English version.
- Ensure translations are culturally appropriate and context-aware.
- Use gender-neutral language where possible.
- Keep special placeholders (e.g., `{{variable}}`) intact.

## Testing Your Translations

After making changes:

1. Run the application locally.
2. Switch to the language you've edited.
3. Navigate through the app to verify your translations in context.

## Submitting Your Contribution

1. Create a new branch for your changes.
2. Commit your changes with a clear, descriptive message.
3. Open a pull request with details about the languages and sections you've updated.

Thank you for helping make our project more accessible to users worldwide!
