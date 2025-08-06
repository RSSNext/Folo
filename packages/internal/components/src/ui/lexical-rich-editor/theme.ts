/**
 * Default Lexical theme configuration for consistent styling
 * across editable and read-only rich text components.
 *
 * Uses Follow's UIKit color system with Tailwind classes for
 * automatic light/dark mode adaptation.
 */
export const defaultLexicalTheme = {
  paragraph: "mb-1 last:mb-0",
  text: {
    bold: "font-semibold",
    italic: "italic",
    strikethrough: "line-through",
    underline: "underline",
    code: "bg-fill px-1 py-0.5 rounded text-sm font-mono",
  },
  heading: {
    h1: "text-2xl font-bold mb-2",
    h2: "text-xl font-bold mb-2",
    h3: "text-lg font-bold mb-1",
    h4: "text-base font-bold mb-1",
    h5: "text-sm font-bold mb-1",
    h6: "text-xs font-bold mb-1",
  },
  list: {
    nested: {
      listitem: "list-none",
    },
    ol: "list-decimal list-inside mb-2",
    ul: "list-disc list-inside mb-2",
    listitem: "mb-1",
  },
  quote: "border-l-4 border-accent pl-4 italic mb-2",
  code: "bg-fill px-3 py-2 rounded font-mono text-sm mb-2 block overflow-x-auto",
  codeHighlight: {
    atrule: "text-purple-400",
    attr: "text-blue-400",
    boolean: "text-orange-400",
    builtin: "text-purple-400",
    cdata: "text-gray-400",
    char: "text-green-400",
    class: "text-blue-400",
    "class-name": "text-blue-400",
    comment: "text-gray-400",
    constant: "text-orange-400",
    deleted: "text-red-400",
    doctype: "text-gray-400",
    entity: "text-orange-400",
    function: "text-yellow-400",
    important: "text-red-400",
    inserted: "text-green-400",
    keyword: "text-purple-400",
    namespace: "text-blue-400",
    number: "text-orange-400",
    operator: "text-pink-400",
    prolog: "text-gray-400",
    property: "text-blue-400",
    punctuation: "text-gray-300",
    regex: "text-green-400",
    selector: "text-green-400",
    string: "text-green-400",
    symbol: "text-orange-400",
    tag: "text-red-400",
    url: "text-blue-400",
    variable: "text-orange-400",
  },
  link: "text-accent underline hover:text-accent/80",
  mark: "bg-yellow-200 px-1 py-0.5 rounded",
}
