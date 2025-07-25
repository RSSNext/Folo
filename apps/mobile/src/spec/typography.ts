export const typography = {
  largeTitle: [32, 36], // 32px
  title1: [28, 32], // 28px
  title2: [24, 28], // 24px
  title3: [20, 24], // 20px
  headline: [18, 22], // 18px
  body: [16, 20], // 16px
  callout: [14, 20], // 14px
  subheadline: [13, 18], // 13px
  footnote: [12, 16], // 12px
  caption: [11, 14], // 11px

  // Tailwind CSS typography sizes (converted to px with 16px base)
  xs: [12, 16], // 0.75rem -> 12px, 1rem -> 16px
  sm: [14, 20], // 0.875rem -> 14px, 1.25rem -> 20px
  base: [16, 24], // 1rem -> 16px, 1.5rem -> 24px
  lg: [18, 28], // 1.125rem -> 18px, 1.75rem -> 28px
  xl: [20, 28], // 1.25rem -> 20px, 1.75rem -> 28px
  "2xl": [24, 32], // 1.5rem -> 24px, 2rem -> 32px
  "3xl": [30, 36], // 1.875rem -> 30px, 2.25rem -> 36px
  "4xl": [36, 40], // 2.25rem -> 36px, 2.5rem -> 40px
  "5xl": [48, 48], // 3rem -> 48px, lineHeight: 1
  "6xl": [60, 60], // 3.75rem -> 60px, lineHeight: 1
  "7xl": [72, 72], // 4.5rem -> 72px, lineHeight: 1
  "8xl": [96, 96], // 6rem -> 96px, lineHeight: 1
  "9xl": [128, 128], // 8rem -> 128px, lineHeight: 1
} as const
