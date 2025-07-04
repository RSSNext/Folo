// import type { UseChatHelpers } from "@ai-sdk/react"
// import { Button } from "@follow/components/ui/button/index.js"
// import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.js"
// import { cn } from "@follow/utils"
// import { use, useState } from "react"

// import { whoami } from "~/atoms/user"
// import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"

// import { AIIcon } from "../icon"
// import { AIChatContext, AIPanelRefsContext } from "./__internal__/AIChatContext"
// import { AIChatInput } from "./AIChatInput"
// import { AIMessageList } from "./AIMessageList"

// // Header component for both states
// const ChatHeader = ({ inChat }: { inChat: boolean }) => {
//   const settingModalPresent = useSettingModal()
//   const { panelRef } = use(AIPanelRefsContext)

//   return (
//     <div className="flex w-full flex-row items-center justify-between" ref={panelRef}>
//       {inChat && <AIIcon />}
//       <div className="flex h-8 w-full flex-row justify-end gap-2">
//         {inChat && (
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <Button
//                 variant="ghost"
//                 buttonClassName="text-text-secondary hover:text-text size-8 p-0"
//                 onClick={() => {}}
//               >
//                 <i className="i-mgc-add-cute-fi text-base" />
//               </Button>
//             </TooltipTrigger>
//             <TooltipContent>New Chat</TooltipContent>
//           </Tooltip>
//         )}
//         <Tooltip>
//           <TooltipTrigger asChild>
//             <Button
//               variant="ghost"
//               buttonClassName="text-text-secondary hover:text-text size-8 p-0"
//             >
//               <i className="i-mgc-time-cute-re text-base" />
//             </Button>
//           </TooltipTrigger>
//           <TooltipContent>History</TooltipContent>
//         </Tooltip>
//         <Tooltip>
//           <TooltipTrigger asChild>
//             <Button
//               variant="ghost"
//               buttonClassName="text-text-secondary hover:text-text size-8 p-0"
//               onClick={() => {
//                 settingModalPresent("ai")
//               }}
//             >
//               <i className="i-mgc-user-setting-cute-re text-base" />
//             </Button>
//           </TooltipTrigger>
//           <TooltipContent>Personalize</TooltipContent>
//         </Tooltip>
//       </div>
//     </div>
//   )
// }

// // Chat input wrapper component
// const ChatInputWrapper = ({
//   input,
//   setInput,
//   append,
// }: {
//   input: string
//   setInput: (value: string) => void
//   append: UseChatHelpers["append"]
// }) => {
//   return (
//     <AIChatInput
//       hideIcon
//       onSubmit={(value) => {
//         append({
//           role: "user" as const,
//           content: value,
//         })
//       }}
//       input={input}
//       setInput={setInput}
//     />
//   )
// }

// // Welcome screen for new chat
// const WelcomeScreen = ({
//   input,
//   setInput,
//   append,
// }: {
//   input: string
//   setInput: (value: string) => void
//   append: UseChatHelpers["append"]
// }) => {
//   const user = whoami()

//   return (
//     <div className="flex size-full flex-col">
//       {/* 顶部问候语 section */}
//       <div className="shrink-0 pb-8 pt-16">
//         <div className="text-text flex flex-row items-center justify-center gap-3 text-2xl font-medium">
//           <div>
//             <AIIcon />
//           </div>
//           <p className="animate-mask-left-to-right !duration-700">
//             Hi {user?.name}, how may I assist you today?
//           </p>
//         </div>
//       </div>

//       <div className="flex flex-1 items-start justify-center px-8">
//         <AIChatHelp onSuggestionClick={setInput} />
//       </div>

//       <div className="shrink-0 px-8">
//         <div className="mx-auto max-w-3xl">
//           <ChatInputWrapper input={input} setInput={setInput} append={append} />
//         </div>
//       </div>
//     </div>
//   )
// }

// // Chat conversation screen
// const ConversationScreen = ({
//   messages,
//   input,
//   setInput,
//   append,
// }: {
//   messages: any[]
//   input: string
//   setInput: (value: string) => void
//   append: UseChatHelpers["append"]
// }) => {
//   return (
//     <div className="relative mx-auto flex min-h-0 w-full flex-1 flex-col justify-center gap-8">
//       <AIMessageList messages={messages} />
//       <ChatInputWrapper input={input} setInput={setInput} append={append} />
//     </div>
//   )
// }

// export const AIChatPanel = () => {
//   const { messages, input, setInput, append } = use(AIChatContext)
//   const inChat = messages.length > 0

//   // Early return based on chat state
//   if (inChat) {
//     return (
//       <div className="flex size-full flex-col p-8">
//         <ChatHeader inChat={true} />
//         <ConversationScreen messages={messages} input={input} setInput={setInput} append={append} />
//       </div>
//     )
//   }

//   return (
//     <div className="flex size-full flex-col p-8">
//       <ChatHeader inChat={false} />
//       <WelcomeScreen input={input} setInput={setInput} append={append} />
//     </div>
//   )
// }

// const AIChatHelp = ({ onSuggestionClick }: { onSuggestionClick: (suggestion: string) => void }) => {
//   const [isExpanded, setIsExpanded] = useState(false)

//   const suggestionsData = [
//     {
//       category: "My unread items",
//       icon: "i-mgc-round-cute-re",
//       suggestions: [
//         "Organize all unread items into a mind map",
//         "According to my reading habits and interests, reduce unread items to less than 100",
//         'Highlight unread items containing "OpenAI" in their content',
//       ],
//     },
//     {
//       category: "My subscriptions",
//       icon: "i-mgc-star-cute-re",
//       suggestions: [
//         "Summarize my starred items from the past week and make it into a poster",
//         "Create a timeline of AI-related content",
//       ],
//     },
//     {
//       category: `Everything on ${APP_NAME}`,
//       icon: "i-mgc-world-2-cute-re",
//       suggestions: [
//         "Generate a list of technology podcasts",
//         "Compare the crypto market sentiment this week with last week",
//         "Which podcasts have recently mentioned OpenAI's o3 model?",
//       ],
//     },
//   ]

//   return (
//     <div className="w-full max-w-4xl">
//       {/* Header with expand/collapse */}
//       <div className="mb-6 flex items-center justify-center">
//         <div className="text-text-secondary text-sm font-normal">
//           <div className="flex items-center gap-2">
//             <i className="i-mgc-question-cute-re text-base" />
//             <span>What can I do for you?</span>
//           </div>
//         </div>
//       </div>

//       {/* Suggestions Grid */}
//       <div
//         className={cn(
//           "overflow-hidden transition-all duration-300 ease-in-out",
//           isExpanded ? "max-h-[800px] opacity-100" : "max-h-96 opacity-100",
//         )}
//       >
//         <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//           {suggestionsData.map((section) => {
//             const displaySuggestions = isExpanded
//               ? section.suggestions
//               : section.suggestions.slice(0, 1)
//             const hasMoreSuggestions = section.suggestions.length > 1

//             return (
//               <div
//                 key={section.category}
//                 className="bg-material-medium border-fill-tertiary hover:border-fill-secondary rounded-xl border p-5 backdrop-blur-sm transition-all duration-200"
//               >
//                 <div className="mb-4 flex items-start gap-3">
//                   <i className={cn(section.icon, "text-accent mt-0.5 flex-shrink-0 text-lg")} />
//                   <h3 className="text-text text-sm font-medium">{section.category}</h3>
//                 </div>
//                 <div className="ml-7">
//                   <ul className="space-y-3">
//                     {displaySuggestions.map((suggestion, suggestionIndex) => (
//                       <li
//                         key={suggestionIndex}
//                         className="text-text-secondary hover:text-text hover:bg-fill-tertiary/50 cursor-pointer rounded-lg text-xs leading-relaxed transition-colors"
//                         onClick={() => onSuggestionClick(suggestion)}
//                       >
//                         {suggestion}
//                       </li>
//                     ))}
//                   </ul>
//                   {!isExpanded && hasMoreSuggestions && (
//                     <div className="border-fill-tertiary mt-3 flex justify-end border-t pt-3">
//                       <button
//                         type="button"
//                         onClick={() => setIsExpanded(true)}
//                         className="text-accent hover:text-accent/80 flex items-center gap-1 text-xs font-medium transition-colors"
//                       >
//                         <span>+{section.suggestions.length - 1} more</span>
//                         <i className="i-mgc-right-cute-re text-xs" />
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )
//           })}
//         </div>

//         {!isExpanded && (
//           <div className="mt-6 text-center">
//             <Button
//               variant="ghost"
//               buttonClassName="text-text-tertiary hover:text-text-secondary text-xs"
//               onClick={() => setIsExpanded(true)}
//             >
//               <div className="flex items-center gap-2">
//                 <span>View all suggestions</span>
//                 <i className="i-mingcute-down-line text-xs" />
//               </div>
//             </Button>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

export {}
