'use server'

export async function getGithubStar() {
  return await fetch(`https://api.github.com/repos/RSSNext/Folo`, {
    headers: {
      Authorization: process.env.GITHUB_TOKEN
        ? `Bearer ${process.env.GITHUB_TOKEN}`
        : '',
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.message) {
        throw new Error(data.message)
      }

      return data.stargazers_count as number
    })
    .catch((e) => {
      console.error(e)
      return -1
    })
}
