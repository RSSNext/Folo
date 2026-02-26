const sortObjectKeys = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((element) => sortObjectKeys(element))
  }

  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = sortObjectKeys(obj[key])
      return acc
    }, {})
}
/**
 * @type {import("eslint").ESLint.Plugin}
 */
export default {
  rules: {
    'recursive-sort': {
      meta: {
        type: 'layout',
        fixable: 'code',
      },
      create(context) {
        return {
          Program(node) {
            if (context.getFilename().endsWith('.json')) {
              const sourceCode = context.getSourceCode()
              const text = sourceCode.getText()

              try {
                const json = JSON.parse(text)
                const sortedJson = sortObjectKeys(json)
                const sortedText = JSON.stringify(sortedJson, null, 2)

                if (text.trim() !== sortedText.trim()) {
                  context.report({
                    node,
                    message: 'JSON keys are not sorted recursively',
                    fix(fixer) {
                      return fixer.replaceText(node, sortedText)
                    },
                  })
                }
              } catch (error) {
                context.report({
                  node,
                  message: `Invalid JSON: ${error.message}`,
                })
              }
            }
          },
        }
      },
    },
  },
}
