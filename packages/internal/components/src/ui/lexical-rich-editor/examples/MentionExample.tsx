import React, { useCallback, useState } from "react"

import { LexicalRichEditor } from "../LexicalRichEditor"
import type { MentionData, MentionType } from "../nodes/MentionNode"

/**
 * Example implementation of LexicalRichEditor with mention support
 * 
 * This demonstrates:
 * - Basic mention functionality
 * - Custom search function
 * - Event handling
 * - Multiple mention types (user, topic, channel)
 */

// Mock data for demonstration
const MOCK_USERS: MentionData[] = [
  {
    id: "1",
    name: "john_doe",
    type: "user",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
    description: "Software Engineer at Follow",
  },
  {
    id: "2",
    name: "jane_smith",
    type: "user",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jane",
    description: "UI/UX Designer",
  },
  {
    id: "3",
    name: "bob_wilson",
    type: "user",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
    description: "Product Manager",
  },
  {
    id: "4",
    name: "alice_johnson",
    type: "user",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
    description: "Technical Writer",
  },
]

const MOCK_TOPICS: MentionData[] = [
  {
    id: "1",
    name: "javascript",
    type: "topic",
    description: "JavaScript programming language discussions",
  },
  {
    id: "2",
    name: "react",
    type: "topic",
    description: "React library and ecosystem",
  },
  {
    id: "3",
    name: "lexical",
    type: "topic",
    description: "Lexical rich text editor framework",
  },
  {
    id: "4",
    name: "design-system",
    type: "topic",
    description: "Design system and UI components",
  },
]

const MOCK_CHANNELS: MentionData[] = [
  {
    id: "1",
    name: "general",
    type: "channel",
    description: "General team discussions",
  },
  {
    id: "2",
    name: "dev-team",
    type: "channel",
    description: "Development team coordination",
  },
  {
    id: "3",
    name: "design",
    type: "channel",
    description: "Design team discussions",
  },
  {
    id: "4",
    name: "product",
    type: "channel",
    description: "Product planning and updates",
  },
]

export const MentionExample: React.FC = () => {
  const [editorContent, setEditorContent] = useState("")
  const [mentionEvents, setMentionEvents] = useState<string[]>([])

  // Custom search function
  const handleMentionSearch = useCallback(async (query: string, type: MentionType): Promise<MentionData[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200))

    const cleanQuery = query.replace(/^@[#+]?/, "").toLowerCase()
    
    let searchData: MentionData[] = []
    switch (type) {
      case "user":
        searchData = MOCK_USERS
        break
      case "topic":
        searchData = MOCK_TOPICS
        break
      case "channel":
        searchData = MOCK_CHANNELS
        break
    }

    if (!cleanQuery) {
      return searchData.slice(0, 4)
    }

    return searchData
      .filter(item => 
        item.name.toLowerCase().includes(cleanQuery) ||
        item.description?.toLowerCase().includes(cleanQuery)
      )
      .slice(0, 6)
  }, [])

  // Event handlers
  const handleMentionInsert = useCallback((mention: MentionData) => {
    const event = `Inserted ${mention.type}: @${mention.name} (${mention.id})`
    setMentionEvents(prev => [event, ...prev.slice(0, 9)])
    console.log("Mention inserted:", mention)
  }, [])

  const handleMentionClick = useCallback((mention: MentionData) => {
    const event = `Clicked ${mention.type}: @${mention.name} (${mention.id})`
    setMentionEvents(prev => [event, ...prev.slice(0, 9)])
    console.log("Mention clicked:", mention)
  }, [])

  const handleEditorChange = useCallback((editorState: any, editor: any) => {
    // Get plain text content for display
    editorState.read(() => {
      const textContent = editor.getRootElement()?.textContent || ""
      setEditorContent(textContent)
    })
  }, [])

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-title1 font-bold text-text">
          Lexical Mention System Demo
        </h2>
        <p className="text-body text-text-secondary">
          Type @ to mention users, @# for channels, or @+ for topics. Use arrow keys to navigate and Enter to select.
        </p>
      </div>

      {/* Editor */}
      <div className="border border-fill-secondary rounded-xl overflow-hidden bg-material-thin">
        <div className="border-b border-fill-secondary px-4 py-2 bg-fill-secondary">
          <h3 className="text-headline font-medium text-text">Rich Text Editor with Mentions</h3>
        </div>
        <div className="p-4">
          <LexicalRichEditor
            placeholder="Type your message here... Use @ to mention users, @# for channels, or @+ for topics"
            className="min-h-32"
            onChange={handleEditorChange}
            enabledPlugins={{
              history: true,
              markdown: true,
              list: true,
              link: true,
              autoFocus: true,
              mentions: {
                onSearch: handleMentionSearch,
                onMentionInsert: handleMentionInsert,
                mentionTypes: ["user", "topic", "channel"],
                maxSuggestions: 8,
              },
            }}
          />
        </div>
      </div>

      {/* Content Preview */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-fill-secondary rounded-xl overflow-hidden bg-material-thin">
          <div className="border-b border-fill-secondary px-4 py-2 bg-fill-secondary">
            <h3 className="text-headline font-medium text-text">Plain Text Content</h3>
          </div>
          <div className="p-4">
            <pre className="text-caption text-text-secondary whitespace-pre-wrap font-mono">
              {editorContent || "No content yet..."}
            </pre>
          </div>
        </div>

        <div className="border border-fill-secondary rounded-xl overflow-hidden bg-material-thin">
          <div className="border-b border-fill-secondary px-4 py-2 bg-fill-secondary">
            <h3 className="text-headline font-medium text-text">Recent Events</h3>
          </div>
          <div className="p-4">
            {mentionEvents.length === 0 ? (
              <p className="text-caption text-text-tertiary italic">No events yet...</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {mentionEvents.map((event, index) => (
                  <div
                    key={index}
                    className="text-caption text-text-secondary p-2 bg-fill rounded border-l-2 border-accent"
                  >
                    {event}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="border border-fill-secondary rounded-xl overflow-hidden bg-material-thin">
        <div className="border-b border-fill-secondary px-4 py-2 bg-fill-secondary">
          <h3 className="text-headline font-medium text-text">Usage Instructions</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <h4 className="text-subheadline font-medium text-text">Mention Types:</h4>
            <ul className="space-y-1 text-caption text-text-secondary ml-4">
              <li>• <code className="bg-fill px-1 rounded">@username</code> - Mention users</li>
              <li>• <code className="bg-fill px-1 rounded">@#channel</code> - Mention channels</li>
              <li>• <code className="bg-fill px-1 rounded">@+topic</code> - Mention topics</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-subheadline font-medium text-text">Keyboard Shortcuts:</h4>
            <ul className="space-y-1 text-caption text-text-secondary ml-4">
              <li>• <kbd className="bg-fill-secondary px-1 rounded">↑↓</kbd> Navigate suggestions</li>
              <li>• <kbd className="bg-fill-secondary px-1 rounded">Enter</kbd> or <kbd className="bg-fill-secondary px-1 rounded">Tab</kbd> Select mention</li>
              <li>• <kbd className="bg-fill-secondary px-1 rounded">Escape</kbd> Cancel mentions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

MentionExample.displayName = "MentionExample"