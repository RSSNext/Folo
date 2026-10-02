// Matches the per-locale avoid lists in demo-account/scenes.json against text
// on screen: whole words for words written in Latin script ("war" must not
// hit "software"), substrings for CJK.
const latinWord = /^[\p{Script=Latin}\s'-]+$/u

export const mentionsAvoided = (text: string, words: string[]) =>
  words.some((word) =>
    latinWord.test(word)
      ? new RegExp(`(?<![\\p{L}\\p{N}])${word}(?![\\p{L}\\p{N}])`, "iu").test(text)
      : text.includes(word),
  )
