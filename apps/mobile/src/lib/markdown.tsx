import { parseMarkdown } from "@follow/components/utils/parse-markdown.tsx"
import * as React from "react"
import { Linking, Text, TextInput, View } from "react-native"

// Helper function to ensure text is wrapped in Text component
const wrapText = (children: any): any => {
  if (typeof children === "string") {
    if (children.trim() === "") {
      return null
    }
    return <Text className="text-label text-[16px] leading-[24px]">{children}</Text>
  }
  if (Array.isArray(children)) {
    return children.map((child, index) => {
      if (typeof child === "string") {
        if (child.trim() === "") {
          return null
        }
        return (
          <Text key={index} className="text-label text-[16px] leading-[24px]">
            {child}
          </Text>
        )
      }
      if (React.isValidElement(child)) {
        return child
      }
      // Handle other types recursively
      return wrapText(child)
    })
  }
  if (React.isValidElement(children)) {
    return children
  }
  // For any other type, try to convert to string and wrap
  if (children != null) {
    if (children.trim() === "") {
      return null
    }
    return <Text className="text-label text-[16px] leading-[24px]">{String(children)}</Text>
  }
  return children
}

// Helper function to safely render children in Text components
const renderTextChildren = (
  children: any,
  _className = "text-label text-[16px] leading-[24px]",
): any => {
  if (typeof children === "string") {
    return children
  }
  if (Array.isArray(children)) {
    return children.map((child, index) => {
      if (typeof child === "string") {
        return child
      }
      if (React.isValidElement(child)) {
        // If it's already a React element, render it as is
        return <React.Fragment key={index}>{child}</React.Fragment>
      }
      return String(child)
    })
  }
  if (React.isValidElement(children)) {
    return children
  }
  return String(children || "")
}

export const renderMarkdown = (markdown: string) => {
  // Fallback component for unknown HTML elements
  const FallbackComponent = ({ children, node, ..._props }: any) => {
    // For text-like elements, use Text
    if (
      typeof children === "string" ||
      (Array.isArray(children) && children.every((child) => typeof child === "string"))
    ) {
      return (
        <Text className="text-label text-[16px] leading-[24px]">
          {renderTextChildren(children)}
        </Text>
      )
    }
    // For container-like elements, use View and wrap any text children
    return <View>{wrapText(children)}</View>
  }

  // Create components object with fallback for unknown elements
  const components = new Proxy(
    {
      // React Native compatible components - GitHub markdown style
      p: ({ children, node, ...props }: any) => (
        <TextInput className="text-label mb-4 leading-[24px]" multiline readOnly {...props}>
          {renderTextChildren(children)}
        </TextInput>
      ),

      h1: ({ children, node, ...props }: any) => (
        <TextInput
          readOnly
          multiline
          className="text-label border-non-opaque-separator mb-4 mt-6 border-b pb-2 text-[32px] font-semibold leading-[40px]"
          {...props}
        >
          {renderTextChildren(children)}
        </TextInput>
      ),
      h2: ({ children, node, ...props }: any) => (
        <TextInput
          readOnly
          multiline
          className="text-label border-non-opaque-separator mb-4 mt-6 border-b pb-2 text-[24px] font-semibold leading-[30px]"
          {...props}
        >
          {renderTextChildren(children)}
        </TextInput>
      ),
      h3: ({ children, node, ...props }: any) => (
        <TextInput
          readOnly
          multiline
          className="text-label mb-4 mt-6 text-[20px] font-semibold leading-[25px]"
          {...props}
        >
          {renderTextChildren(children)}
        </TextInput>
      ),
      h4: ({ children, node, ...props }: any) => (
        <TextInput
          readOnly
          multiline
          className="text-label mb-4 mt-6 text-[16px] font-semibold leading-[20px]"
          {...props}
        >
          {renderTextChildren(children)}
        </TextInput>
      ),
      h5: ({ children, node, ...props }: any) => (
        <TextInput
          readOnly
          multiline
          className="text-label mb-4 mt-6 text-[14px] font-semibold leading-[18px]"
          {...props}
        >
          {renderTextChildren(children)}
        </TextInput>
      ),
      h6: ({ children, node, ...props }: any) => (
        <TextInput
          readOnly
          multiline
          className="text-secondary-label mb-4 mt-6 text-[13px] font-semibold leading-[16px]"
          {...props}
        >
          {renderTextChildren(children)}
        </TextInput>
      ),
      ul: ({ children, node, ...props }: any) => (
        <View className="mb-4 pl-4" {...props}>
          {wrapText(children)}
        </View>
      ),
      ol: ({ children, node, ...props }: any) => (
        <View className="mb-4 pl-4" {...props}>
          {wrapText(children)}
        </View>
      ),
      li: ({ children, node, ordered, index, ...props }: any) => {
        const bullet = ordered ? `${(index || 0) + 1}.` : "•"
        return (
          <View className="mb-1 flex-row items-start" {...props}>
            <Text className="text-label mt-0 min-w-[24px] text-[16px] leading-[24px]">
              {bullet}
            </Text>
            <View className="flex-1">
              <Text className="text-label text-[16px] leading-[24px]">
                {renderTextChildren(children)}
              </Text>
            </View>
          </View>
        )
      },
      strong: ({ children, node, ...props }: any) => (
        <Text className="font-semibold" {...props}>
          {renderTextChildren(children)}
        </Text>
      ),
      b: ({ children, node, ...props }: any) => (
        <Text className="font-semibold" {...props}>
          {renderTextChildren(children)}
        </Text>
      ),
      em: ({ children, node, ...props }: any) => (
        <Text className="italic" {...props}>
          {renderTextChildren(children)}
        </Text>
      ),
      i: ({ children, node, ...props }: any) => (
        <Text className="italic" {...props}>
          {renderTextChildren(children)}
        </Text>
      ),
      code: ({ children, node, ...props }: any) => (
        <Text
          className="bg-quaternary-system-fill text-label rounded-md px-2 py-1 font-mono text-[14px]"
          {...props}
        >
          {renderTextChildren(children)}
        </Text>
      ),
      pre: ({ children, node, ...props }: any) => (
        <View
          className="bg-secondary-system-background border-non-opaque-separator mb-4 rounded-lg border p-4"
          {...props}
        >
          <Text className="text-label font-mono text-[14px] leading-[20px]">
            {renderTextChildren(children)}
          </Text>
        </View>
      ),
      blockquote: ({ children, node, ...props }: any) => (
        <View
          className="border-non-opaque-separator bg-secondary-system-background border-l-accent mb-4 rounded-r-lg border-l-4 py-2 pl-4"
          {...props}
        >
          <Text className="text-secondary-label italic leading-[24px]">
            {renderTextChildren(children)}
          </Text>
        </View>
      ),
      a: ({ children, href, node, ...props }: any) => (
        <Text
          className="text-accent font-medium underline"
          onPress={() => href && Linking.openURL(href)}
          {...props}
        >
          {renderTextChildren(children)}
        </Text>
      ),
      hr: ({ node, ..._props }: any) => <View className="bg-non-opaque-separator my-3 h-px" />,
      br: ({ node, ..._props }: any) => <Text>{"\n"}</Text>,
      // Common HTML elements that might appear
      div: ({ children, node, ...props }: any) => <View {...props}>{wrapText(children)}</View>,
      span: ({ children, node, ...props }: any) => (
        <Text className="text-label leading-[24px]" {...props}>
          {renderTextChildren(children)}
        </Text>
      ),
      // Table elements (GFM table support) - GitHub style with improved mobile layout
      table: ({ children, node, ...props }: any) => (
        <View
          className="border-non-opaque-separator mb-4 overflow-hidden rounded-md border"
          {...props}
        >
          {wrapText(children)}
        </View>
      ),
      thead: ({ children, node, ...props }: any) => (
        <View className="bg-secondary-system-background" {...props}>
          {wrapText(children)}
        </View>
      ),
      tbody: ({ children, node, ...props }: any) => <View {...props}>{wrapText(children)}</View>,
      tr: ({ children, node, ...props }: any) => (
        <View className="border-non-opaque-separator flex-row border-b last:border-b-0" {...props}>
          {wrapText(children)}
        </View>
      ),
      th: ({ children, node, ...props }: any) => {
        // Get text alignment from node properties if available
        const align = node?.properties?.align || "left"
        const textAlignStyle =
          align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"

        return (
          <Text
            className={`text-label flex-1 px-3 py-2 font-semibold leading-[20px] ${textAlignStyle}`}
            {...props}
          >
            {renderTextChildren(children)}
          </Text>
        )
      },
      td: ({ children, node, ...props }: any) => {
        // Get text alignment from node properties if available
        const align = node?.properties?.align || "left"
        const textAlignStyle =
          align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"

        return (
          <Text
            className={`text-label flex-1 px-3 py-2 text-[14px] leading-[20px] ${textAlignStyle}`}
            {...props}
          >
            {renderTextChildren(children)}
          </Text>
        )
      },

      // Not implemented
      img: ({ src, alt, node, ..._props }: any) => null,
      del: ({ children, node, ...props }: any) => (
        <Text className="text-label line-through" {...props}>
          {renderTextChildren(children)}
        </Text>
      ),
      sup: ({ children, node, ...props }: any) => (
        <Text className="text-label text-[14px] leading-[20px]" {...props}>
          {renderTextChildren(children)}
        </Text>
      ),
      sub: ({ children, node, ...props }: any) => (
        <Text className="text-label text-[14px] leading-[20px]" {...props}>
          {renderTextChildren(children)}
        </Text>
      ),
      section: ({ children, node, ...props }: any) => (
        <View className="mb-4" {...props}>
          {wrapText(children)}
        </View>
      ),
    },
    {
      get(target, prop) {
        // If the component exists, return it
        if (prop in target) {
          return target[prop as keyof typeof target]
        }
        // Otherwise, return the fallback component
        return FallbackComponent
      },
    },
  )

  // Convert hast to React Native components
  const result = parseMarkdown(markdown, {
    components,
  }).content

  return {
    ...result,
    props: {
      ...result.props,
      children: Array.isArray(result.props?.children)
        ? result.props.children.filter((child: any) => {
            if (typeof child === "string") {
              return child.trim() !== ""
            }
            return true
          })
        : result.props.children,
    },
  }
}
