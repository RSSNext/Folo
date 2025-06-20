import { describe, expect, test } from "vitest"

import { buildGlobRoutes } from "./route-builder"

const fakePromise = () => Promise.resolve({ default: () => {} })
describe("test route builder", () => {
  test("match snapshot", () => {
    expect(
      buildGlobRoutes({
        "./pages/(external)/layout.tsx": fakePromise,
        "./pages/(external)/(with-layout)/index.tsx": fakePromise,
        "./pages/(external)/(with-layout)/layout.tsx": fakePromise,
        "./pages/(external)/(with-layout)/feed/[id]/index.tsx": fakePromise,
        "./pages/(external)/(with-layout)/feed/[id]/layout.tsx": fakePromise,

        "./pages/(main)/layout.tsx": fakePromise,
        "./pages/(main)/(context)/layout.tsx": fakePromise,
        "./pages/(main)/(context)/discover/layout.tsx": fakePromise,
        "./pages/(main)/(context)/discover/index.tsx": fakePromise,

        "./pages/preview.tsx": fakePromise,
        "./pages/add/layout.tsx": fakePromise,
        "./pages/add/index.tsx": fakePromise,
      }),
    ).toMatchInlineSnapshot(`
      [
        {
          "children": [
            {
              "children": [
                {
                  "children": [
                    {
                      "children": [
                        {
                          "handle": {
                            "fs": "./pages/(main)/(context)/discover/index/",
                            "fullPath": "/discover/",
                          },
                          "lazy": [Function],
                          "path": "",
                        },
                      ],
                      "handle": {
                        "fs": "./pages/(main)/(context)/discover/layout",
                        "fullPath": "/discover",
                      },
                      "lazy": [Function],
                      "path": "",
                    },
                  ],
                  "handle": {
                    "fs": "./pages/(main)/(context)/discover/discover",
                    "fullPath": "/discover",
                  },
                  "path": "discover",
                },
              ],
              "handle": {
                "fs": "./pages/(main)/(context)",
                "fullPath": "",
              },
              "lazy": [Function],
              "path": "",
            },
          ],
          "handle": {
            "fs": "./pages/(main)",
            "fullPath": "",
          },
          "lazy": [Function],
          "path": "",
        },
        {
          "children": [
            {
              "children": [
                {
                  "handle": {
                    "fs": "./pages/add/index/",
                    "fullPath": "/add/",
                  },
                  "lazy": [Function],
                  "path": "",
                },
              ],
              "handle": {
                "fs": "./pages/add/layout",
                "fullPath": "/add",
              },
              "lazy": [Function],
              "path": "",
            },
          ],
          "handle": {
            "fs": "./pages/add/add",
            "fullPath": "/add",
          },
          "path": "add",
        },
        {
          "handle": {
            "fs": "./pages/preview/preview",
            "fullPath": "/preview",
          },
          "lazy": [Function],
          "path": "preview",
        },
        {
          "children": [
            {
              "children": [
                {
                  "children": [
                    {
                      "children": [
                        {
                          "children": [
                            {
                              "handle": {
                                "fs": "./pages/(external)/(with-layout)/feed/[id]/index/",
                                "fullPath": "/feed/:id/",
                              },
                              "lazy": [Function],
                              "path": "",
                            },
                          ],
                          "handle": {
                            "fs": "./pages/(external)/(with-layout)/feed/[id]/layout",
                            "fullPath": "/feed/:id",
                          },
                          "lazy": [Function],
                          "path": "",
                        },
                      ],
                      "handle": {
                        "fs": "./pages/(external)/(with-layout)/feed/[id]/:id",
                        "fullPath": "/feed/:id",
                      },
                      "path": ":id",
                    },
                  ],
                  "handle": {
                    "fs": "./pages/(external)/(with-layout)/feed/feed",
                    "fullPath": "/feed",
                  },
                  "path": "feed",
                },
                {
                  "handle": {
                    "fs": "./pages/(external)/(with-layout)/index/",
                    "fullPath": "/",
                  },
                  "lazy": [Function],
                  "path": "",
                },
              ],
              "handle": {
                "fs": "./pages/(external)/(with-layout)",
                "fullPath": "",
              },
              "lazy": [Function],
              "path": "",
            },
          ],
          "handle": {
            "fs": "./pages/(external)",
            "fullPath": "",
          },
          "lazy": [Function],
          "path": "",
        },
      ]
    `)
  })
})
