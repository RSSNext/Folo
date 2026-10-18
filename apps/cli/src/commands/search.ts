import type { Command } from "commander"

import { parseChoice, parsePositiveInt, parseView, viewHelp } from "../args"
import { runCommand } from "../command"
import { toDiscoveryRow, toTrendingRow } from "../table-views"

type DiscoverTarget = "feeds" | "lists"
type TrendingRange = "1d" | "3d" | "7d" | "30d"
type TrendingLanguage = "eng" | "cmn"

const parseDiscoverTarget = parseChoice<DiscoverTarget>("discover type", ["feeds", "lists"])
const parseTrendingRange = parseChoice<TrendingRange>("range", ["1d", "3d", "7d", "30d"])
const parseTrendingLanguage = parseChoice<TrendingLanguage>("language", ["eng", "cmn"])

interface SearchDiscoverOptions {
  type?: DiscoverTarget
}

interface SearchRsshubOptions {
  lang?: string
}

interface SearchTrendingOptions {
  category?: string
  range?: TrendingRange
  view?: number
  limit?: number
  language?: TrendingLanguage
}

export const registerSearchCommand = (program: Command) => {
  const searchCommand = program.command("search").description("Discover feeds and lists")

  searchCommand
    .command("discover")
    .description("Discover feeds or lists")
    .argument("<keyword>", "Search keyword")
    .option("--type <type>", "Discover target: feeds | lists", parseDiscoverTarget)
    .action(async function (this: Command, keyword: string, options: SearchDiscoverOptions) {
      await runCommand(
        this,
        async ({ client }) => {
          const response = await client.api.discover.discover({
            keyword,
            target: options.type,
          })
          return response.data
        },
        { table: (items) => items.map(toDiscoveryRow) },
      )
    })

  searchCommand
    .command("rsshub")
    .description("Search RSSHub routes by category keyword")
    .argument("<keyword>", "Category keyword")
    .option("--lang <lang>", "Language tag")
    .action(async function (this: Command, keyword: string, options: SearchRsshubOptions) {
      await runCommand(this, async ({ client }) => {
        const response = await client.api.discover.rsshub({
          categories: keyword,
          lang: options.lang,
        })
        return response.data
      })
    })

  searchCommand
    .command("trending")
    .description("Get trending feeds")
    .option("--category <category>", "Filter by category keyword in title/description")
    .option("--range <range>", "Trending range: 1d | 3d | 7d | 30d", parseTrendingRange, "7d")
    .option("--view <type>", `View type: ${viewHelp}`, parseView)
    .option("--limit <n>", "Result limit", parsePositiveInt, 20)
    .option("--language <lang>", "Language: eng | cmn", parseTrendingLanguage)
    .action(async function (this: Command, options: SearchTrendingOptions) {
      await runCommand(
        this,
        async ({ client }) => {
          const response = await client.api.trending.getFeeds({
            range: options.range,
            view: options.view,
            limit: options.limit,
            language: options.language,
          })

          const keyword = options.category?.trim().toLowerCase()
          const feeds = keyword
            ? response.data.filter((item) => {
                const title = item.feed.title?.toLowerCase() || ""
                const description = item.feed.description?.toLowerCase() || ""
                return title.includes(keyword) || description.includes(keyword)
              })
            : response.data

          return {
            feeds,
          }
        },
        { table: (result) => ({ feeds: result.feeds.map(toTrendingRow) }) },
      )
    })
}
