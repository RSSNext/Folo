# Lexical Rich Editor with Mention System

A comprehensive rich text editor built on Lexical with advanced mention functionality, following Follow's design system and modern React patterns.

## Features

### Core Editor
- **Modern Lexical Integration**: Uses latest Lexical APIs with DecoratorNode pattern
- **Rich Text Support**: Markdown shortcuts, lists, links, code blocks, and syntax highlighting
- **Follow UI Design**: Integrates seamlessly with Follow's UIKit color system
- **TypeScript First**: Full TypeScript support with comprehensive type definitions

### Mention System
- **Multiple Mention Types**: Support for users (@username), topics (@+topic), and channels (@#channel)
- **Real-time Search**: Async search with debouncing and loading states
- **Keyboard Navigation**: Full keyboard support (↑↓ to navigate, Enter/Tab to select, Esc to cancel)
- **Visual Feedback**: Hover states, animations, and contextual tooltips
- **Accessibility**: ARIA labels, screen reader support, and proper focus management

## Usage

### Basic Editor

```tsx
import { LexicalRichEditor } from "@follow/components/ui/lexical-rich-editor"

export function MyEditor() {
  return (
    <LexicalRichEditor
      placeholder="Enter your message..."
      enabledPlugins={{
        history: true,
        markdown: true,
        list: true,
        link: true,
        autoFocus: true,
      }}
    />
  )
}
```

### Editor with Mentions

```tsx
import { LexicalRichEditor, type MentionData, type MentionType } from "@follow/components/ui/lexical-rich-editor"

const searchMentions = async (query: string, type: MentionType): Promise<MentionData[]> => {
  // Your search implementation
  const response = await fetch(`/api/mentions?q=${query}&type=${type}`)
  return response.json()
}

export function EditorWithMentions() {
  return (
    <LexicalRichEditor
      placeholder="Type @ to mention users, @# for channels, or @+ for topics"
      enabledPlugins={{
        history: true,
        markdown: true,
        list: true,
        link: true,
        autoFocus: true,
        mentions: {
          onSearch: searchMentions,
          mentionTypes: ["user", "topic", "channel"],
          maxSuggestions: 10,
          onMentionInsert: (mention) => {
            console.log("Mention inserted:", mention)
          },
        },
      }}
    />
  )
}
```

## Architecture

### Components

- **LexicalRichEditor**: Main editor component with plugin system
- **MentionNode**: Lexical decorator node for rendering mentions
- **MentionPlugin**: Core plugin handling mention detection and insertion
- **MentionDropdown**: UI component for mention suggestions
- **MentionComponent**: Rendered mention with styling and interactions

### Key Files

```
lexical-rich-editor/
├── LexicalRichEditor.tsx       # Main editor component
├── nodes/
│   └── MentionNode.tsx         # Mention decorator node
├── plugins/
│   ├── MentionPlugin.tsx       # Mention detection & insertion
│   └── KeyboardPlugin.tsx      # Keyboard event handling
├── components/
│   ├── MentionDropdown.tsx     # Suggestion UI
│   └── MentionComponent.tsx    # Rendered mention
├── utils/
│   └── mention-utils.ts        # Utility functions
├── types/
│   └── mention-types.ts        # TypeScript definitions
├── examples/
│   └── MentionExample.tsx      # Demo implementation
├── theme.ts                    # Styling configuration
└── nodes.ts                    # Node registry
```

## Mention Types

### User Mentions (`@username`)
- Triggered by typing `@` followed by text
- Typically used for mentioning team members or users
- Styled with blue accent colors

### Topic Mentions (`@+topic`)
- Triggered by typing `@+` followed by text
- Used for referencing topics, tags, or categories
- Styled with green accent colors

### Channel Mentions (`@#channel`)
- Triggered by typing `@#` followed by text
- Used for referencing channels, rooms, or groups
- Styled with purple accent colors

## Customization

### Search Function

```tsx
const customSearch = async (query: string, type: MentionType) => {
  // Custom search logic
  switch (type) {
    case "user":
      return await searchUsers(query)
    case "topic":
      return await searchTopics(query)
    case "channel":
      return await searchChannels(query)
    default:
      return []
  }
}
```

### Styling

The mention system uses Follow's UIKit color system:

```tsx
// Automatic light/dark mode adaptation
text-text          // Primary text
text-text-secondary // Secondary text
bg-fill            // Background fills
bg-material-thick  // Glass morphism backgrounds
border-fill-secondary // Borders
```

### Event Handling

```tsx
<LexicalRichEditor
  enabledPlugins={{
    mentions: {
      onMentionInsert: (mention) => {
        // Handle mention insertion
        analytics.track("mention_inserted", { type: mention.type })
      },
      onSearch: async (query, type) => {
        // Custom search with analytics
        analytics.track("mention_search", { query, type })
        return await searchMentions(query, type)
      },
    },
  }}
/>
```

## Advanced Features

### Commands

The mention system provides Lexical commands for programmatic control:

```tsx
import { MENTION_COMMAND } from "@follow/components/ui/lexical-rich-editor"

// Programmatically insert mention
editor.dispatchCommand(MENTION_COMMAND, {
  id: "user-123",
  name: "john_doe",
  type: "user",
})
```

### Utilities

```tsx
import {
  $findMentionNodes,
  $getMentionsFromEditor,
  formatMentionDisplay,
  validateMentionData,
} from "@follow/components/ui/lexical-rich-editor"

// Find all mentions in editor
const mentions = $findMentionNodes(editor)

// Extract mention data
const mentionData = $getMentionsFromEditor(editor)

// Format for display
const displayText = formatMentionDisplay(mentionData)
```

## Performance

- **Lazy Loading**: Components are loaded on-demand
- **Debounced Search**: Search requests are debounced to prevent excessive API calls
- **Virtual Scrolling**: Large suggestion lists are optimized
- **Memoization**: Expensive operations are memoized for performance

## Accessibility

- **Keyboard Navigation**: Full support for keyboard-only usage
- **Screen Readers**: Proper ARIA labels and announcements
- **Focus Management**: Logical focus flow and restoration
- **High Contrast**: Respects system accessibility preferences

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Migration

### From v1 to v2
The mention system uses modern Lexical APIs. If migrating from an older implementation:

1. Update node registration to include `MentionNode`
2. Replace old mention trigger patterns with the new `MentionPlugin`
3. Update theme configuration to include mention styles
4. Migrate search functions to use the new async pattern

## Contributing

When contributing to the mention system:

1. Follow TypeScript strict mode requirements
2. Use Follow's UIKit color system for styling
3. Maintain accessibility standards
4. Add comprehensive tests for new features
5. Update this README for new functionality

## Examples

See `examples/MentionExample.tsx` for a complete working implementation demonstrating all features of the mention system.