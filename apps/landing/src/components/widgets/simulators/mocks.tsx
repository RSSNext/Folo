import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip'

export type Reader = {
  id: string
  name: string
  avatar: string
}

export type EntryDetail = {
  title: string
  author: {
    name: string
    avatar: string
    email: string
    date: string
  }
  readers: Reader[]
}

export const ENTRY_DETAIL: EntryDetail = {
  title: 'Categorization Your Dependencies',
  author: {
    name: 'Anthony Fu',
    avatar:
      'https://webp.follow.is?url=https%3A%2F%2Fantfu.me%2Favatar.png&width=32&height=32',
    email: 'hi@antfu.me',
    date: 'Apr 28, 2025 10:00 PM',
  },
  readers: [
    {
      id: '1',
      name: 'Hyoban',
      avatar: 'https://avatars-githubusercontent-webp.webp.se/u/38493346?v=4',
    },
    {
      id: '2',
      name: 'Innei',
      avatar: 'https://avatars-githubusercontent-webp.webp.se/u/41265413?v=4',
    },
  ],
}

type ToolInvocation = {
  toolName: string
  input: string
  output: string
}

export const AI_TOOL_INVOCATION: ToolInvocation = {
  toolName: 'getEntry',
  input: `{
  "id": "139726960627129344",
  "mode": "detailed"
}`,
  output: `{
  "id": "139726960627129344",
  "title": "Categorize Your Dependencies",
  "url": "https://antfu.me/posts/categorize-deps",
  "author": "hi@antfu.me (Anthony Fu)",
  "publishedAt": "2025-04-28T14:00:00.612Z",
  "feedId": "39296322994753536",
  "subtitles": null,
  "transcription": null
}
`,
}
export type UserContext = {
  current?: string
  className?: string
  icon?: React.ReactNode
}

type UserPlainTextStep = {
  role: 'user'
  message: string
  context?: UserContext
}
type UserComponentStep = {
  role: 'user'
  component: React.ReactNode
  context?: {
    current?: string
    className?: string
    icon?: React.ReactNode
  }
}
type UserStep = UserPlainTextStep | UserComponentStep
type AIReasoningPart = {
  type: 'reasoning'
  text: string
}
type ToolUIPart = {
  type: 'tool-invocation'
  data: ToolInvocation
}
type MarkdownUIPart = {
  type: 'markdown'
  message: string
}
type AssistantStep = (AIReasoningPart | ToolUIPart | MarkdownUIPart) & {
  role: 'assistant'
}
type ActionStep = {
  role: 'action'
  type: 'set-title'
  title: string
}
export type AI_CHAT_STEP = UserStep | AssistantStep | ActionStep

export const AI_SUMMARY_STEPS: AI_CHAT_STEP[] = [
  {
    role: 'user',
    message: 'What talking about this article, and how to solve this problem?',
    context: {
      current: 'Categorization Your Dependencies',
      className: 'text-orange',
      icon: <i className="size-2.5 i-mingcute-star-fill" />,
    },
  },
  {
    role: 'assistant',
    type: 'tool-invocation',
    data: AI_TOOL_INVOCATION,
  },

  {
    role: 'assistant',
    type: 'reasoning',
    text: "**Summarizing actionable steps**\n\nI need to provide a summary of the article's main points and how to address the identified problem effectively. First, I’ll focus on categorizing dependencies using pnpm catalogs and utilizing tooling support such as a VSCode extension. The actionable steps should include setting up pnpm-workspace.yaml, defining categories like test and build, and running audits. My step-by-step plan involves mapping categories, adding catalogs, updating dependencies, installing...",
  },
  {
    role: 'assistant',
    type: 'reasoning',
    text: "**Updating CI and Tooling**\n\nI need to detail steps for updating CI and tooling, including using taze and eslint-plugin-pnpm, along with adjusting the build configuration to reference catalogs. I’ll run tests and builds while modifying optimizeDeps in Vite/unbuild using readWorkspaceYaml. Additionally, I should verify with node-modules-inspector and implement a gradual rollout by migrating packages in phases while monitoring for dependency diffs and vulnerabilities.\n\nIt's important to note the b...",
  },
  {
    role: 'assistant',
    type: 'reasoning',
    text: "**Providing Actionable Steps**\n\nI want to include actionable steps and command snippets for using pnpm, such as in pnpm-workspace.yaml and package.json, while avoiding heavy formatting. It’s okay to mention the entry instead of repeating full code, but I’ll provide enough snippets to be helpful. \n\nI’ll ensure to use Markdown effectively, including inline citations when mentioning the pnpm catalogs feature. The goal is to be concise while offering clear, actionable steps. I'll also mention releva...",
  },
  {
    role: 'action',
    type: 'set-title',
    title: 'PNPM Catalogs for Dependency Categorization in Monorepos',
  },
  {
    role: 'assistant',
    type: 'markdown',
    message: `Short summary — what the article says
- The post argues that the simple split between "dependencies" and "devDependencies" no longer captures why a package is installed (build tool, lint/test, runtime, IDE types, inlined into bundles, etc.). Instead, it proposes categorizing dependencies (test, lint, build, frontend, backend, types, inlined, prod, …) and shows how pnpm’s new “catalogs” (including named catalogs) let you express those categories centrally and consistently in a monorepo. It also shows practical tooling and UX improvements (VS Code lens, taze, eslint-plugin-pnpm, node-modules-inspector) to make catalogs workable in real projects.

Why this matters (the problem)
- package.json’s two buckets are overloaded and ambiguous: the same package in devDependencies could mean very different things in different contexts (types-only, test-only, inlined, etc.).
- That ambiguity makes reviews, upgrades, bundling, and tooling behavior harder to reason about.
- Moving version/category metadata into a centralized catalog can make dependency intent explicit and enable better tooling decisions.

How to solve it — practical, runnable plan
1. Pick categories you need
   - Examples: test, lint, build, script, frontend, backend, types, inlined, prod. Decide what each means for your project.

2. Add catalogs to your pnpm workspace
   - In pnpm-workspace.yaml, add a catalog or named catalogs with the package versions you want to manage centrally. (The article shows examples.)

3. Reference catalogs from package.json
   - Replace explicit versions with catalog references, e.g. "vue": "catalog:frontend" or "vue": "catalog:". PNPM resolves them at install time.

4. Install and validate
   - Run pnpm install. Use the workspace tools to confirm the resolved versions match expectations.

5. Add UX/tooling so the change is manageable
   - Install PNPM Catalog Lens (VS Code extension) to show resolved versions inline.
   - Use node-modules-inspector to visualize catalog origins.
   - Use eslint-plugin-pnpm to enforce catalog usage and auto-fix where applicable.

6. Integrate catalogs into build & dev tooling
   - Read catalogs from pnpm-workspace.yaml in tool configs (Vite optimizeDeps, unbuild externals/inline lists) so bundlers/optimizers act on the new categories instead of relying on dependencies/devDependencies.

7. Automate version bumps & reviews
   - Use tools that understand catalogs (taze, or CI scripts) to check and bump versions centrally so PRs show the actual version changes in one place (pnpm-workspace.yaml).

8. Roll out gradually and monitor
   - Migrate a small package or one category first, run CI/tests, confirm bundling and runtime behavior, then continue. Keep comments in pnpm-workspace.yaml to explain decisions to teammates.

Benefits and caveats
- Benefits: clearer intent per package, centralized version control, easier upgrade/review, potential to inform bundlers/linters, better context for vulnerability risk.
- Caveats: catalogs are pnpm-specific (and target monorepos best), package.json loses inline version numbers (so tooling is needed to surface resolved versions), ecosystem/tooling is still evolving—expect to add integrations.

If you want, you can follow the article’s examples for the pnpm-workspace.yaml and the package.json changes and adopt the VS Code PNPM Catalog Lens + eslint-plugin-pnpm to make migration smooth.
`,
  },
]

export const TIMELINE_SUMMARY_STEPS: AI_CHAT_STEP[] = [
  {
    role: 'user',
    context: {
      current: 'All',
      className: 'text-xs font-medium',
      icon: <i className="size-2.5 i-mingcute-bubble-fill" />,
    },

    component: (
      <Tooltip>
        <TooltipTrigger>
          <span className="relative inline-flex select-none items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors border border-fill font-mono bg-fill-secondary/50 hover:bg-fill-secondary text-text-secondary hover:text-text cursor-default">
            <span className="mr-0.5 text-[10px] text-text-tertiary opacity-60">
              /
            </span>
            <span className="flex items-center justify-center mr-1 size-3">
              <i className="i-mgc-send-plane-cute-re" />
            </span>
            <span className="truncate text-xs">Summarize</span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          Generate a concise timeline summary based on entries within the
          current timeline within 24 hours. Recap the day in a casual,
          conversational tone instead of a rigid report. Open with a few relaxed
          sentences or light bullets that call out standout topics or shifts.
          Wrap up by casually noting any other interesting threads; if nothing
          else stands out, say so naturally.
        </TooltipContent>
      </Tooltip>
    ),
  },
  {
    role: 'assistant',
    type: 'markdown',
    message: `Hey there! It looks like the last 24 hours have been buzzing with conversations around AI, from its fundamental principles to its impact on the world.

Here’s a quick look at what’s been happening:

- There's a running theme on the evolution of Artificial Intelligence. One article argues that AI safety and scalability aren't mutually exclusive goals. Adding to that, a new podcast, "The Cyber60," is set to explore how we can forge security in a world powered by AI. And for a deeper dive, Raghu Raghuram discusses how AI and robotics are fundamentally reshaping tech infrastructure.
- Shifting gears to business and leadership, a16z shared an interesting take on why Stanford GSB might not be the go-to for finding leaders.

Wrapping things up, there was also a bit of chatter in the crypto space about Zcash as a privacy-focused alternative to Bitcoin. And that's the quick and dirty of your timeline today
`,
  },
  {
    role: 'user',
    context: {
      current: 'All',
      className: 'text-xs font-medium',
      icon: <i className="size-2.5 i-mingcute-bubble-fill" />,
    },
    message: `how will robotics reshape tech infrastructure?`,
  },

  {
    role: 'assistant',
    type: 'markdown',
    message: `Of course! I've just reviewed the discussion with Raghu Raghuram on the a16z podcast to get you the details.

The core idea is that the explosive growth of AI is creating a demand for new hardware and data centers that is too massive and rapid to be built by human labor alone. Here's how they see robotics reshaping the tech infrastructure:

- :building_construction: Automating the Foundation of AI

According to Raghu, the process of building and assembling the powerful AI servers packed with GPUs is currently very manual—as much as 70-80% labor. To meet the incredible demand for AI compute, robotics will be essential to automate the construction of everything from the servers themselves to the entire data centers that house them. He believes it's the only way to scale to the level required.

- :jigsaw: Building New Layers of Infrastructure

The development of robotics for these specific tasks (like data center assembly) will lead to the creation of new, more general infrastructure. As robots are deployed, there will be a need for:

- Horizontal Tools: Software and platforms for things like simulation and managing sensor data will become necessary.

- New Data Infrastructure: Systems will be needed to synchronize all the data coming from various sensors on the robots to train them effectively.

Essentially, by solving the very specific problem of building data centers, a whole new set of horizontal tools and platforms will emerge, creating a new layer of the tech infrastructure stack.`,
  },
]
