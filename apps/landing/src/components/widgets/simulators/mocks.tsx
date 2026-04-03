import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip'

export type EntryDetail = {
  title: string
  source: {
    name: string
    host: string
    icon: string
  }
  author: {
    name: string
    role: string
    dateLabel: string
    readingTime: string
  }
}

export const ENTRY_DETAIL: EntryDetail = {
  title: 'Building effective agents for production teams',
  source: {
    name: 'Anthropic',
    host: 'anthropic.com',
    icon: 'https://icons.folo.is/anthropic.com',
  },
  author: {
    name: 'Anthropic Research',
    role: 'Agent systems guide',
    dateLabel: 'Updated recently',
    readingTime: '8 min read',
  },
}

type ToolInvocation = {
  toolName: string
  input: string
  output: string
}

export const AI_TOOL_INVOCATION: ToolInvocation = {
  toolName: 'getEntry',
  input: `{
  "id": "184203101927882752",
  "mode": "detailed"
}`,
  output: `{
  "id": "184203101927882752",
  "title": "Building effective agents for production teams",
  "url": "https://www.anthropic.com/news",
  "author": "Anthropic Research",
  "publishedAt": "2026-03-14T09:30:00.000Z",
  "feedId": "249743826993702912",
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
    message:
      'What changed here, and what should an engineering team actually do next?',
    context: {
      current: 'Building effective agents for production teams',
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
    text: '**Finding the operational delta**\n\nThe article is not pitching agents as a prompt trick. It is framing production agents as a systems problem: tool boundaries, state, evals, retry policy, and approval gates matter more than flashy demos. I should separate platform claims from the concrete engineering steps a team would need to ship safely.',
  },
  {
    role: 'assistant',
    type: 'reasoning',
    text: '**Reducing it to a production checklist**\n\nThe strongest through-line is that agent quality comes from narrower loops and better observability. The answer should emphasize explicit tool contracts, structured outputs, test cases for failure modes, and human review at expensive or risky steps.',
  },
  {
    role: 'assistant',
    type: 'reasoning',
    text: '**Shaping the final response**\n\nI can keep this useful by translating the article into three layers: what the article claims, what signals are worth keeping, and what a team should instrument before calling an agent "production-ready."',
  },
  {
    role: 'action',
    type: 'set-title',
    title: 'How to move AI agents from demos to production',
  },
  {
    role: 'assistant',
    type: 'markdown',
    message: `Short summary
- The article argues that strong agent products come from tighter system design, not just stronger prompts. Teams are getting better results by shrinking the loop: clear tool contracts, explicit handoffs, structured outputs, and smaller scopes per step.

What matters
- The main bottleneck is reliability. Once an agent can call tools or trigger side effects, every unclear interface becomes an operational bug.
- Evaluation is part of the product. Teams need regression suites for tool use, refusal behavior, retries, latency, and cost.
- Human approval still matters at high-risk steps. Good production systems use agents to draft, classify, and route work before they let them act.

What to do next
1. Start with a narrow task and one or two tools.
2. Force structured outputs instead of free-form text.
3. Log every tool call, retry, and failure mode.
4. Add evals before expanding scope.
5. Put human review in front of expensive, external, or irreversible actions.

Bottom line
- The winning pattern is not “one model does everything.” It is a measured workflow where the model reasons inside clear boundaries and the product team can inspect every step.
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
