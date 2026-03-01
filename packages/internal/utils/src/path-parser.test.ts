import { compile, pathToRegexp } from "path-to-regexp"
import { describe, expect, it } from "vitest"

import {
  MissingOptionalParamError,
  MissingRequiredParamError,
  parseFullPathParams,
  parseRegexpPathParams,
  regexpPathToPath,
  transformUriPath,
} from "./path-parser"

describe("test `transformUriPath()`", () => {
  it("normal path", () => {
    expect(transformUriPath("/issues/all")).toMatchInlineSnapshot(`"/issues/all"`)
  })

  it("has tailing optional params", () => {
    const path = transformUriPath("/issues/:id?")
    expect(path).toMatchInlineSnapshot(`"/issues{/:id}"`)
    expect(compile(path)({})).toMatchInlineSnapshot(`"/issues"`)
    const regexp = pathToRegexp(path)
    expect(regexp.keys).toMatchInlineSnapshot(`
      [
        {
          "name": "id",
          "type": "param",
        },
      ]
    `)
  })

  it("has tailing optional params and with value", () => {
    const path = transformUriPath("/issues/:id?")

    expect(
      compile(path)({
        id: "1111111",
      }),
    ).toMatchInlineSnapshot(`"/issues/1111111"`)
    const regexp = pathToRegexp(path)
    expect(regexp.keys).toMatchInlineSnapshot(`
      [
        {
          "name": "id",
          "type": "param",
        },
      ]
    `)
  })

  it("catch all path", () => {
    const path = transformUriPath("/:path{.+}?")
    expect(path).toMatchInlineSnapshot(`"{/*path}"`)
    expect(
      compile(path)({
        path: ["a", "b", "c"],
      }),
    ).toMatchInlineSnapshot(`"/a/b/c"`)
  })

  it("catch all path with leading route", () => {
    const path = transformUriPath("/issues/:path{.+}?")
    expect(path).toMatchInlineSnapshot(`"/issues{/*path}"`)
    expect(
      compile(path)({
        path: ["a", "b", "c"],
      }),
    ).toMatchInlineSnapshot(`"/issues/a/b/c"`)
  })

  it("catch all path but value is query search string", () => {
    const path = transformUriPath("/issues/:path{.+}?")
    expect(path).toMatchInlineSnapshot(`"/issues{/*path}"`)
    expect(
      compile(path)({
        path: ["a=1&b=2"],
      }),
    ).toMatchInlineSnapshot(`"/issues/a%3D1%26b%3D2"`)
  })

  it("catch all route via `*`", () => {
    expect(transformUriPath("/issues/*")).toMatchInlineSnapshot(`"/issues{/:__catchAll__}"`)
    expect(transformUriPath("*")).toMatchInlineSnapshot(`"{/:__catchAll__}"`)
  })
})

describe("test `regexpPathToPath()`", () => {
  it("normal path", () => {
    expect(regexpPathToPath("/issues/all", {})).toMatchInlineSnapshot(`"/issues/all"`)
  })
  it("path with optional params", () => {
    expect(regexpPathToPath("/issues/:id?", {})).toMatchInlineSnapshot(`"/issues"`)
    expect(regexpPathToPath("/issues/:id?", { id: "1" })).toMatchInlineSnapshot(`"/issues/1"`)
  })

  it("path with many optional params", () => {
    expect(
      regexpPathToPath("/issue/:user/:repo/:state?/:labels?", {
        user: "rssnext",
        repo: "follow",
      }),
    ).toMatchInlineSnapshot(`"/issue/rssnext/follow"`)
  })

  it("path with many optional params, but when using the optional parameter(s) after the optional parameter(s), the previous optional parameter(s) is/are not filled in.", () => {
    expect(() =>
      regexpPathToPath("/issue/:user/:repo/:state?/:labels?", {
        user: "rssnext",
        repo: "follow",
        labels: "rss",
      }),
    ).toThrowError(MissingOptionalParamError)
  })
  it("path with many optional params, but when using the optional parameter(s) after the optional parameter(s), the previous optional parameter(s) is/are not filled in.", () => {
    expect(() =>
      regexpPathToPath("/ranking/:rid?/:day?/:arc_type?/:disableEmbed?", {
        day: "1",
      }),
    ).toThrowError(MissingOptionalParamError)
  })

  it("missing required param", () => {
    expect(() => regexpPathToPath("/issue/:user/:repo/:state?/:labels?", {})).toThrow(
      MissingRequiredParamError,
    )
  })

  it("path with many optional params and all inputted", () => {
    expect(
      regexpPathToPath("/issue/:user/:repo/:state?/:labels?", {
        user: "rssnext",
        repo: "follow",
        state: "open",
        labels: "rss",
      }),
    ).toMatchInlineSnapshot(`"/issue/rssnext/follow/open/rss"`)
  })

  it("omit empty string and nil value", () => {
    expect(
      regexpPathToPath(
        "/issue/:user/:repo/:state?/:labels?",
        {
          user: "rssnext",
          repo: "follow",
          state: "open",
          labels: "",
        },
        {
          omitNilAndEmptyString: true,
        },
      ),
    ).toMatchInlineSnapshot(`"/issue/rssnext/follow/open"`)
  })

  it("omit empty string and nil value will throw", () => {
    expect(() =>
      regexpPathToPath(
        "/issue/:user/:repo/:state?/:labels?",
        {
          user: "rssnext",
          repo: "follow",
          state: "",
          labels: "l",
        },
        {
          omitNilAndEmptyString: true,
        },
      ),
    ).toThrow(MissingOptionalParamError)
  })

  it("omit empty string and nil value will throw (default behavior)", () => {
    expect(() =>
      regexpPathToPath("/issue/:user/:repo/:state?/:labels?", {
        user: "rssnext",
        repo: "follow",
        state: "",
        labels: "l",
      }),
    ).toThrow(MissingOptionalParamError)
  })

  it("empty string will pass", () => {
    expect(
      regexpPathToPath(
        "/issue/:user/:repo/:state?/:labels?",
        {
          user: "rssnext",
          repo: "follow",
          state: "",
          labels: "l",
        },
        { omitNilAndEmptyString: false },
      ),
    ).toMatchInlineSnapshot(`"/issue/rssnext/follow//l"`)
  })
})

describe("test `parseRegexpPathParams()`", () => {
  it("normal path", () => {
    expect(parseRegexpPathParams("/issues/all")).toMatchInlineSnapshot(`
      []
    `)
  })

  it("path with optional params", () => {
    expect(parseRegexpPathParams("/issues/:id?")).toMatchInlineSnapshot(`
      [
        {
          "isCatchAll": false,
          "name": "id",
          "optional": true,
        },
      ]
    `)
  })

  it("path with many optional params", () => {
    expect(parseRegexpPathParams("/issue/:user/:repo/:state?/:labels?")).toMatchInlineSnapshot(`
      [
        {
          "isCatchAll": false,
          "name": "user",
          "optional": false,
        },
        {
          "isCatchAll": false,
          "name": "repo",
          "optional": false,
        },
        {
          "isCatchAll": false,
          "name": "state",
          "optional": true,
        },
        {
          "isCatchAll": false,
          "name": "labels",
          "optional": true,
        },
      ]
    `)
  })

  it("catch all path", () => {
    expect(parseRegexpPathParams("/:path{.+}?")).toMatchInlineSnapshot(`
      [
        {
          "isCatchAll": true,
          "name": "path",
          "optional": true,
        },
      ]
    `)
  })

  it("with excludeNames", () => {
    expect(
      parseRegexpPathParams("/issue/:user/:repo/:state?/:labels?/:routeParams?", {
        excludeNames: ["state", "routeParams"],
      }),
    ).toMatchInlineSnapshot(`
      [
        {
          "isCatchAll": false,
          "name": "user",
          "optional": false,
        },
        {
          "isCatchAll": false,
          "name": "repo",
          "optional": false,
        },
        {
          "isCatchAll": false,
          "name": "labels",
          "optional": true,
        },
      ]
    `)
  })
})

describe("test `parseFullPathParams()`", () => {
  it("case 1", () => {
    expect(parseFullPathParams("/user/123344", "/user/:id")).toMatchInlineSnapshot(`
      {
        "id": "123344",
      }
    `)
  })
  it("case 2", () => {
    expect(parseFullPathParams("/build/wangqiru/ttrss", "/build/:user/:name"))
      .toMatchInlineSnapshot(`
      {
        "name": "ttrss",
        "user": "wangqiru",
      }
    `)
  })
})
