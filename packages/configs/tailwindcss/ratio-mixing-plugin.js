const plugin = require("tailwindcss/plugin")

const defaultConfig = {
  colorSpace: "srgb",
  baseColors: {
    background: "hsl(var(--background))",
    accent: "hsl(var(--fo-a))",
    red: "rgb(var(--color-red))",
    transparent: "transparent",
    // Map to existing theme colors from UIKit
  },
  variants: ["bg", "border", "text"],
  prefix: "mix",
  implicitBackground: "background",
}

const ratioMixingPlugin = plugin.withOptions(
  (options = {}) => {
    return ({ addUtilities }) => {
      const config = { ...defaultConfig, ...options }
      const utilities = {}

      // Generate dynamic ratio-based utilities
      generateDynamicRatioUtilities(addUtilities, config)

      // Generate percentage-based utilities (fallback)
      generatePercentageBasedUtilities(utilities, config)

      addUtilities(utilities)
    }
  },
  () => {
    return {
      theme: {
        // Theme extensions if needed
      },
    }
  },
)

function generateDynamicRatioUtilities(addUtilities, config) {
  const { baseColors, variants, colorSpace } = config
  const utilities = {}

  // Generate dynamic utilities that parse ratios from class names
  // Pattern: bg-mix-accent/background-7/3 or bg-mix-accent/background-1.5/2
  Object.entries(baseColors).forEach(([color1Name, color1Value]) => {
    Object.entries(baseColors).forEach(([color2Name, color2Value]) => {
      if (color1Name === color2Name) return // Skip same color mixing

      variants.forEach((variant) => {
        const property = getPropertyName(variant)

        // Generate a utility that can accept arbitrary ratio values
        const classPattern = `.${variant}-${config.prefix}-${color1Name}\\/${color2Name}-([0-9.]+)\\/([0-9.]+)`

        utilities[classPattern] = (match) => {
          const num = Number.parseFloat(match[1])
          const denom = Number.parseFloat(match[2])

          if (num <= 0 || denom <= 0) return {}

          const percentage1 = Math.round((num / (num + denom)) * 100)
          const percentage2 = 100 - percentage1

          const mixedColor = `color-mix(in ${colorSpace}, ${color1Value} ${percentage1}%, ${color2Value} ${percentage2}%)`

          return { [property]: mixedColor }
        }
      })
    })
  })

  // Since we can't use regex patterns directly with addUtilities,
  // we'll use a different approach with addComponents
  const dynamicUtilities = {}

  // Create utilities for common ratios that can be extended
  const commonRatios = [
    [1, 1],
    [1, 2],
    [1, 3],
    [1, 4],
    [2, 1],
    [2, 3],
    [3, 1],
    [3, 2],
    [3, 4],
    [4, 1],
    [4, 3],
    [4, 6],
    [5, 1],
    [7, 3],
    [8, 2],
    [9, 1],
  ]

  Object.entries(baseColors).forEach(([color1Name, color1Value]) => {
    Object.entries(baseColors).forEach(([color2Name, color2Value]) => {
      if (color1Name === color2Name) return

      commonRatios.forEach(([num, denom]) => {
        const percentage1 = Math.round((num / (num + denom)) * 100)
        const percentage2 = 100 - percentage1

        variants.forEach((variant) => {
          const className = `.${variant}-${config.prefix}-${color1Name}\\/${color2Name}-${num}\\/${denom}`
          const property = getPropertyName(variant)
          const mixedColor = `color-mix(in ${colorSpace}, ${color1Value} ${percentage1}%, ${color2Value} ${percentage2}%)`

          dynamicUtilities[className] = { [property]: mixedColor }
        })
      })
    })
  })

  addUtilities(dynamicUtilities)
}

function generatePercentageBasedUtilities(utilities, config) {
  // Generate: bg-mix-accent-70 (implicit background mixing)
  const { baseColors, variants, colorSpace, implicitBackground } = config
  const backgroundValue = baseColors[implicitBackground]

  const percentages = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95]

  Object.entries(baseColors).forEach(([colorName, colorValue]) => {
    if (colorName === implicitBackground) return

    percentages.forEach((percentage) => {
      variants.forEach((variant) => {
        const className = `.${variant}-${config.prefix}-${colorName}-${percentage}`
        const property = getPropertyName(variant)
        const mixedColor = `color-mix(in ${colorSpace}, ${colorValue} ${percentage}%, ${backgroundValue} ${100 - percentage}%)`

        utilities[className] = { [property]: mixedColor }
      })
    })
  })
}

function getPropertyName(variant) {
  switch (variant) {
    case "bg": {
      return "background-color"
    }
    case "border": {
      return "border-color"
    }
    case "text": {
      return "color"
    }
    default: {
      return "background-color"
    }
  }
}

module.exports = ratioMixingPlugin
