import { getCurrentEnvironment } from "@follow/utils/environment"
import { repository } from "@pkg"

interface IssueOptions {
  title: string
  body: string
  label: string
  error?: Error
  target: "issue" | "discussion"
  category: string
  template?: "bug_report.yml" | "feature_request.yml"
}

export const getNewIssueUrl = ({
  body,
  label,
  title,
  error,
  target = "issue",
  category,
  template,
}: Partial<IssueOptions> = {}) => {
  // @see https://docs.github.com/en/enterprise-cloud@latest/issues/tracking-your-work-with-issues/using-issues/creating-an-issue
  const baseUrl =
    target === "discussion" ? `${repository.url}/discussions/new` : `${repository.url}/issues/new`

  const searchParams = new URLSearchParams()
  if (category) searchParams.set("category", category)

  let nextBody = [body || "", "", ...getCurrentEnvironment()].join("\n")
  if (label) searchParams.set("labels", label)
  if (title) searchParams.set("title", title)

  if (error && "traceId" in error && error.traceId) {
    nextBody += `\n\n### Sentry Trace ID\n${error.traceId}`
  }

  searchParams.set("body", nextBody)
  if (template) searchParams.set("template", template)
  return `${baseUrl}?${searchParams.toString()}`
}
