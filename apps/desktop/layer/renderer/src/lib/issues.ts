import { getCurrentEnvironment } from "@follow/utils/environment"
import { repository } from "@pkg"

type IssueTemplate = "bug_report.yml" | "feature_request.yml"

interface IssueOptions {
  title: string
  /** Extra details for the maintainers, e.g. an error message or the affected feed. */
  body: string
  /**
   * Prefer the labels the issue form applies: GitHub documents a 404 for query parameters the user
   * has no permission to use, and most reporters can't label issues.
   */
  label: string
  error?: Error
  template: IssueTemplate
}

/**
 * Ids of the issue form fields in `.github/ISSUE_TEMPLATE` that the link pre-fills. Issue forms
 * don't read the `body` query parameter, each field is pre-filled by its `id` instead.
 *
 * @see https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema#keys
 */
const ISSUE_FORM_FIELDS: Record<IssueTemplate, { details: string; environment?: string }> = {
  "bug_report.yml": { details: "relevant-information", environment: "environment" },
  "feature_request.yml": { details: "additional-context" },
}

/**
 * Build a link that opens a new GitHub issue. GitHub Discussions are disabled for the repository
 * and blank issues are turned off, so every link goes through one of the issue forms.
 *
 * @see https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue#creating-an-issue-from-a-url-query
 */
export const getNewIssueUrl = ({
  body,
  label,
  title,
  error,
  template = "bug_report.yml",
}: Partial<IssueOptions> = {}) => {
  const searchParams = new URLSearchParams()
  searchParams.set("template", template)
  if (title) searchParams.set("title", title)
  if (label) searchParams.set("labels", label)

  const fields = ISSUE_FORM_FIELDS[template]

  const details = body ? [body] : []
  if (error && "traceId" in error && error.traceId) {
    details.push(`### Trace ID\n${error.traceId}`)
  }
  if (details.length > 0) searchParams.set(fields.details, details.join("\n\n"))

  if (fields.environment) {
    searchParams.set(fields.environment, getCurrentEnvironment().join("\n"))
  }

  return `${repository.url}/issues/new?${searchParams.toString()}`
}
