export function getSNProFontFamily(fontFile: string) {
  const subset = /^sn-pro-(.+)-[1-9]00(?:-normal\.woff)?$/.exec(fontFile)?.[1]
  if (!subset) throw new Error(`Unexpected SN Pro font file: ${fontFile}`)

  // Satori selects one font per family/weight/style. Language subsets must
  // have separate families to participate in its missing-glyph fallback.
  return subset === "latin" ? "SN Pro" : `SN Pro ${subset}`
}
