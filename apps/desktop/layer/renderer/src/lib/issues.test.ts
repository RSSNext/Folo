import { describe, expect, it, vi } from "vitest"

import { getNewIssueUrl } from "./issues"

vi.mock("@pkg", () => ({
  repository: { url: "https://github.com/RSSNext/Folo" },
}))

vi.mock("@follow/utils/environment", () => ({
  getCurrentEnvironment: () => ["### Environment", "", "**App Version**: 1.0.0"],
}))

const parseIssueUrl = (href: string) => {
  const url = new URL(href)
  return { pathname: url.pathname, params: url.searchParams }
}

describe("getNewIssueUrl", () => {
  it("opens the bug report issue form by default instead of a discussion", () => {
    const { pathname, params } = parseIssueUrl(getNewIssueUrl())

    expect(pathname).toBe("/RSSNext/Folo/issues/new")
    expect(params.get("template")).toBe("bug_report.yml")
    expect(params.get("environment")).toBe("### Environment\n\n**App Version**: 1.0.0")
    expect(params.has("category")).toBe(false)
  })

  it("pre-fills the issue form fields instead of the ignored body parameter", () => {
    const error = Object.assign(new Error("Request failed"), { traceId: "trace-id" })
    const { params } = parseIssueUrl(
      getNewIssueUrl({
        title: "Feed Error: Example",
        label: "bug",
        body: "### Error\n\nTimeout",
        error,
      }),
    )

    expect(params.get("title")).toBe("Feed Error: Example")
    expect(params.get("labels")).toBe("bug")
    expect(params.get("relevant-information")).toBe(
      "### Error\n\nTimeout\n\n### Trace ID\ntrace-id",
    )
    expect(params.has("body")).toBe(false)
  })

  it("uses the fields of the feature request form", () => {
    const { params } = parseIssueUrl(
      getNewIssueUrl({ template: "feature_request.yml", body: "More context" }),
    )

    expect(params.get("template")).toBe("feature_request.yml")
    expect(params.get("additional-context")).toBe("More context")
    expect(params.has("environment")).toBe(false)
  })
})
