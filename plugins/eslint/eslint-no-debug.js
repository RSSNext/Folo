/**
 * @type {import("eslint").ESLint.Plugin}
 */
export default {
  rules: {
    "no-debug-stack": {
      meta: {
        type: "problem",
        docs: {
          description: "Disallow use of debugStack() function",
          category: "Possible Errors",
          recommended: true,
        },
        fixable: null,
      },
      create(context) {
        return {
          CallExpression(node) {
            if (node.callee.type === "Identifier" && node.callee.name === "debugStack") {
              context.report({
                node,
                message:
                  "Unexpected debugStack() statement. Remove debugStack() calls from production code.",
              })
            }
          },
        }
      },
    },
  },
}
