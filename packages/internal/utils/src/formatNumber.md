# Number Formatting Guide

## Overview

The `formatNumber` function provides localized number formatting for Folo, automatically adapting to the user's language settings.

## Usage

```typescript
import { formatNumber } from "@follow/utils"

// Automatic locale detection
formatNumber(3700) // "3.7K" in English, "3,700" in Korean

// Explicit locale
formatNumber(3700, "ko") // "3,700"
formatNumber(3700, "en") // "3.7K"
```

## Supported Formats

### English and Other Languages (Default)

- **K** - Thousand (1,000+)
- **M** - Million (1,000,000+)
- **B** - Billion (1,000,000,000+)

Examples:

- 1,500 → "1.5K"
- 4,600,000 → "4.6M"
- 2,100,000,000 → "2.1B"

### Korean (ko)

Uses the traditional Korean number system:

- **만** - Ten thousand (10,000+)
- **억** - Hundred million (100,000,000+)
- **조** - Trillion (1,000,000,000,000+)

Examples:

- 3,700 → "3,700" (with commas)
- 15,000 → "1.5만"
- 340,000 → "34만"
- 150,000,000 → "1.5억"
- 1,500,000,000,000 → "1.5조"

## Implementation Details

### Language Detection

The function automatically detects the current language from localStorage in the following order:

1. `follow:I18N_LOCALE` - Primary language setting
2. `follow:general` - General settings object
3. Legacy keys for backward compatibility

### Performance Optimization

- Language detection is cached for 5 seconds to avoid repeated localStorage reads
- Use `clearLanguageCache()` when the user changes language settings

### Clean Number Display

- Whole numbers are displayed without decimals (e.g., "1만" not "1.0만")
- Decimal places are shown only when necessary (e.g., "1.5만")
- Numbers below the threshold use locale-specific formatting (commas for Korean)

## Adding New Languages

To add number formatting for a new language:

1. Add a new condition in the `formatNumber` function:

```typescript
if (currentLocale === "ja") {
  // Japanese formatting logic
}
```

2. Define appropriate thresholds and suffixes for the language
3. Add unit tests for the new locale

## Testing

Run unit tests to verify formatting:

```bash
pnpm test formatNumber.test.ts
```

## Related Functions

- `clearLanguageCache()` - Clear the language cache when user changes language
- `getCurrentLanguage()` - Internal function to detect current language (cached)
