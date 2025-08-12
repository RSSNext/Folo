export default {
  tagFilter: (tag: string) =>
    (tag.startsWith("mobile/v") || tag.startsWith("desktop/v")) && !tag.includes("nightly"),
  dry: !process.env.CI,
}
