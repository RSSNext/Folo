import { describe, expect, test } from "vitest"

import { buildGlobRoutes } from "../utils/route-builder"

const fakePromise = () => Promise.resolve({ default: () => {} })
describe("test route builder", () => {
  test("match snapshot with default filesystem order", () => {
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
                  "handle": {
                    "fs": "./pages/add/index/",
                    "fullPath": "/add/",
                    "isSync": false,
                  },
                  "lazy": [Function],
                  "path": "",
                },
              ],
              "handle": {
                "fs": "./pages/add/layout",
                "fullPath": "/add",
                "isSync": false,
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
            "isSync": false,
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
                                "isSync": false,
                              },
                              "lazy": [Function],
                              "path": "",
                            },
                          ],
                          "handle": {
                            "fs": "./pages/(external)/(with-layout)/feed/[id]/layout",
                            "fullPath": "/feed/:id",
                            "isSync": false,
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
                    "isSync": false,
                  },
                  "lazy": [Function],
                  "path": "",
                },
              ],
              "handle": {
                "fs": "./pages/(external)/(with-layout)",
                "fullPath": "",
                "isSync": false,
              },
              "lazy": [Function],
              "path": "",
            },
          ],
          "handle": {
            "fs": "./pages/(external)",
            "fullPath": "",
            "isSync": false,
          },
          "lazy": [Function],
          "path": "",
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
                          "handle": {
                            "fs": "./pages/(main)/(context)/discover/index/",
                            "fullPath": "/discover/",
                            "isSync": false,
                          },
                          "lazy": [Function],
                          "path": "",
                        },
                      ],
                      "handle": {
                        "fs": "./pages/(main)/(context)/discover/layout",
                        "fullPath": "/discover",
                        "isSync": false,
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
                "isSync": false,
              },
              "lazy": [Function],
              "path": "",
            },
          ],
          "handle": {
            "fs": "./pages/(main)",
            "fullPath": "",
            "isSync": false,
          },
          "lazy": [Function],
          "path": "",
        },
      ]
    `)
  })

  test("match snapshot with custom segment group order", () => {
    expect(
      buildGlobRoutes(
        {
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
        },
        { segmentGroupOrder: ["main", "external"] },
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "children": [
            {
              "children": [
                {
                  "handle": {
                    "fs": "./pages/add/index/",
                    "fullPath": "/add/",
                    "isSync": false,
                  },
                  "lazy": [Function],
                  "path": "",
                },
              ],
              "handle": {
                "fs": "./pages/add/layout",
                "fullPath": "/add",
                "isSync": false,
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
            "isSync": false,
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
                          "handle": {
                            "fs": "./pages/(main)/(context)/discover/index/",
                            "fullPath": "/discover/",
                            "isSync": false,
                          },
                          "lazy": [Function],
                          "path": "",
                        },
                      ],
                      "handle": {
                        "fs": "./pages/(main)/(context)/discover/layout",
                        "fullPath": "/discover",
                        "isSync": false,
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
                "isSync": false,
              },
              "lazy": [Function],
              "path": "",
            },
          ],
          "handle": {
            "fs": "./pages/(main)",
            "fullPath": "",
            "isSync": false,
          },
          "lazy": [Function],
          "path": "",
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
                                "isSync": false,
                              },
                              "lazy": [Function],
                              "path": "",
                            },
                          ],
                          "handle": {
                            "fs": "./pages/(external)/(with-layout)/feed/[id]/layout",
                            "fullPath": "/feed/:id",
                            "isSync": false,
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
                    "isSync": false,
                  },
                  "lazy": [Function],
                  "path": "",
                },
              ],
              "handle": {
                "fs": "./pages/(external)/(with-layout)",
                "fullPath": "",
                "isSync": false,
              },
              "lazy": [Function],
              "path": "",
            },
          ],
          "handle": {
            "fs": "./pages/(external)",
            "fullPath": "",
            "isSync": false,
          },
          "lazy": [Function],
          "path": "",
        },
      ]
    `)
  })

  test("match snapshot with partial custom segment group order", () => {
    expect(
      buildGlobRoutes(
        {
          "./pages/(admin)/layout.tsx": fakePromise,
          "./pages/(external)/layout.tsx": fakePromise,
          "./pages/(main)/layout.tsx": fakePromise,
          "./pages/(settings)/layout.tsx": fakePromise,
        },
        { segmentGroupOrder: ["main"] },
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "children": [],
          "handle": {
            "fs": "./pages/(main)",
            "fullPath": "",
            "isSync": false,
          },
          "lazy": [Function],
          "path": "",
        },
        {
          "children": [],
          "handle": {
            "fs": "./pages/(admin)",
            "fullPath": "",
            "isSync": false,
          },
          "lazy": [Function],
          "path": "",
        },
        {
          "children": [],
          "handle": {
            "fs": "./pages/(external)",
            "fullPath": "",
            "isSync": false,
          },
          "lazy": [Function],
          "path": "",
        },
        {
          "children": [],
          "handle": {
            "fs": "./pages/(settings)",
            "fullPath": "",
            "isSync": false,
          },
          "lazy": [Function],
          "path": "",
        },
      ]
    `)
  })

  test("match snapshot with custom segment group order using parentheses format", () => {
    expect(
      buildGlobRoutes(
        {
          "./pages/(external)/layout.tsx": fakePromise,
          "./pages/(main)/layout.tsx": fakePromise,
          "./pages/(login)/layout.tsx": fakePromise,
        },
        { segmentGroupOrder: ["(main)", "(login)"] },
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "children": [],
          "handle": {
            "fs": "./pages/(main)",
            "fullPath": "",
            "isSync": false,
          },
          "lazy": [Function],
          "path": "",
        },
        {
          "children": [],
          "handle": {
            "fs": "./pages/(login)",
            "fullPath": "",
            "isSync": false,
          },
          "lazy": [Function],
          "path": "",
        },
        {
          "children": [],
          "handle": {
            "fs": "./pages/(external)",
            "fullPath": "",
            "isSync": false,
          },
          "lazy": [Function],
          "path": "",
        },
      ]
    `)
  })

  test("match snapshot with mixed format segment group order", () => {
    expect(
      buildGlobRoutes(
        {
          "./pages/(external)/layout.tsx": fakePromise,
          "./pages/(main)/layout.tsx": fakePromise,
          "./pages/(login)/layout.tsx": fakePromise,
          "./pages/(settings)/layout.tsx": fakePromise,
        },
        { segmentGroupOrder: ["(main)", "login", "external"] },
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "children": [],
          "handle": {
            "fs": "./pages/(main)",
            "fullPath": "",
            "isSync": false,
          },
          "lazy": [Function],
          "path": "",
        },
        {
          "children": [],
          "handle": {
            "fs": "./pages/(login)",
            "fullPath": "",
            "isSync": false,
          },
          "lazy": [Function],
          "path": "",
        },
        {
          "children": [],
          "handle": {
            "fs": "./pages/(external)",
            "fullPath": "",
            "isSync": false,
          },
          "lazy": [Function],
          "path": "",
        },
        {
          "children": [],
          "handle": {
            "fs": "./pages/(settings)",
            "fullPath": "",
            "isSync": false,
          },
          "lazy": [Function],
          "path": "",
        },
      ]
    `)
  })
})
