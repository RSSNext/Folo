type ObsidianFrontmatterValue = string | readonly string[]

export interface ObsidianFrontmatter {
  url: string
  author: string
  publishedAt: string
  description?: string
  tags: readonly string[]
  feedTitle?: string
  feedUrl?: string
}

const normalizeLineEndings = (value: string) => value.replaceAll(/\r\n?/g, "\n")

const isPlainYamlScalar = (value: string) => /^[\w-]+$/.test(value)

const formatYamlString = (value: string) => {
  const normalizedValue = normalizeLineEndings(value)
  if (!normalizedValue.includes("\n")) {
    return JSON.stringify(normalizedValue)
  }

  const lines = normalizedValue.replaceAll(/\n+$/g, "").split("\n")
  return ["|-", ...lines.map((line) => (line.length > 0 ? `  ${line}` : ""))].join("\n")
}

const formatYamlArrayItem = (value: string) => {
  const normalizedValue = normalizeLineEndings(value)
  return isPlainYamlScalar(normalizedValue) ? normalizedValue : JSON.stringify(normalizedValue)
}

const serializeYamlField = (key: string, value: ObsidianFrontmatterValue) => {
  if (typeof value !== "string") {
    return [`${key}:`, ...value.map((item) => `  - ${formatYamlArrayItem(item)}`)]
  }

  const [firstLine, ...restLines] = formatYamlString(value).split("\n")
  return [`${key}: ${firstLine}`, ...restLines]
}

const serializeOptionalStringField = (key: string, value: string | undefined) =>
  value ? serializeYamlField(key, value) : []

const formatPublishedAt = (value: string) => value.replace(/\.\d{3}Z$/, "").replace(/Z$/, "")

const serializeYamlRawField = (key: string, value: string) => [`${key}: ${value}`]

export const createObsidianFrontmatter = (metadata: ObsidianFrontmatter) => {
  const fields = [
    ...serializeYamlField("url", metadata.url),
    ...serializeYamlField("author", metadata.author),
    ...serializeYamlRawField("publishedAt", formatPublishedAt(metadata.publishedAt)),
    ...serializeOptionalStringField("description", metadata.description),
    ...serializeYamlField("tags", metadata.tags),
    ...serializeOptionalStringField("feedTitle", metadata.feedTitle),
    ...serializeOptionalStringField("feedUrl", metadata.feedUrl),
  ]

  return ["---", ...fields, "---"].join("\n")
}
