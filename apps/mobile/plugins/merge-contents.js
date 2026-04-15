function buildMarkers(comment, tag) {
  return {
    start: `${comment} @generated begin ${tag}`,
    end: `${comment} @generated end ${tag}`,
  }
}

function findAnchorIndex(lines, anchor) {
  if (typeof anchor === "string") {
    return lines.findIndex((line) => line.includes(anchor))
  }
  return lines.findIndex((line) => anchor.test(line))
}

function mergeContents({ src, anchor, newSrc, offset = 0, tag, comment = "//" }) {
  const { start, end } = buildMarkers(comment, tag)
  const block = [start, newSrc.trimEnd(), end].join("\n")

  const startIndex = src.indexOf(start)
  const endIndex = src.indexOf(end)
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    return {
      contents: `${src.slice(0, startIndex)}${block}${src.slice(endIndex + end.length)}`,
    }
  }

  const lines = src.split("\n")
  const anchorIndex = findAnchorIndex(lines, anchor)
  if (anchorIndex === -1) {
    throw new Error(`Failed to find anchor for generated block: ${tag}`)
  }

  const insertAt = Math.min(lines.length, anchorIndex + offset + 1)
  lines.splice(insertAt, 0, block)

  return {
    contents: lines.join("\n"),
  }
}

module.exports = {
  mergeContents,
}
