export const linkifyChangelog = (content: string, repoUrl: string) => {
  if (!repoUrl) {
    return content
  }
  const cleanRepoUrl = repoUrl.replace(/\.git$/, "")

  // Linkify commit hashes, e.g., (26c6853)
  let linkedContent = content.replaceAll(
    /\((([a-f0-9]{7,40}))\)/g,
    (match, hash) => `([${hash}](${cleanRepoUrl}/commit/${hash}))`,
  )

  // Linkify issue/PR numbers, e.g., (#3809)
  linkedContent = linkedContent.replaceAll(
    /\(#(\d+)\)/g,
    (match, issue) => `([#${issue}](${cleanRepoUrl}/pull/${issue}))`,
  )

  // Linkify contributors, e.g., @ericyzhu
  linkedContent = linkedContent.replaceAll(
    /\B@([a-z0-9-]+)/gi,
    (match, username) => `[@${username}](https://github.com/${username})`,
  )

  return linkedContent
}
