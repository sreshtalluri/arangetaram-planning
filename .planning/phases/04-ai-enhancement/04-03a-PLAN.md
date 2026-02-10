---
phase: 04-ai-enhancement
plan: 03a
type: execute
wave: 3
depends_on: ["04-02"]
files_modified:
  - frontend/src/components/ai/ChatMessage.tsx
  - frontend/src/components/ai/StarterPrompts.tsx
autonomous: true

must_haves:
  truths:
    - "ChatMessage renders user and assistant messages with distinct styling"
    - "StarterPrompts displays clickable quick-start questions"
    - "Streaming indicator (cursor) pulses during assistant response"
  artifacts:
    - path: "frontend/src/components/ai/ChatMessage.tsx"
      provides: "Individual message rendering"
      exports: ["ChatMessage"]
    - path: "frontend/src/components/ai/StarterPrompts.tsx"
      provides: "Quick action prompts for new users"
      exports: ["StarterPrompts"]
  key_links:
    - from: "frontend/src/components/ai/ChatMessage.tsx"
      to: "useChat types"
      via: "ChatMessage type import"
      pattern: "import.*useChat"
---

<objective>
Create ChatMessage and StarterPrompts components for the chat widget.

Purpose: Atomic UI components that ChatWidget will compose. Splitting lets us focus on styling and behavior.
Output: ChatMessage.tsx with streaming cursor, StarterPrompts.tsx with clickable prompts.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/phases/04-ai-enhancement/04-CONTEXT.md
@.planning/phases/04-ai-enhancement/04-02-SUMMARY.md
@frontend/src/hooks/useChat.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create ChatMessage component</name>
  <files>frontend/src/components/ai/ChatMessage.tsx</files>
  <action>
  Create directory and component:
  ```bash
  mkdir -p frontend/src/components/ai
  ```

  **frontend/src/components/ai/ChatMessage.tsx:**
  ```typescript
  import type { ChatMessage as ChatMessageType } from '../../hooks/useChat'

  interface ChatMessageProps {
    message: ChatMessageType
    isStreaming?: boolean
  }

  export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
    const isUser = message.role === 'user'

    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
            isUser
              ? 'bg-[#0F4C5C] text-white rounded-br-md'
              : 'bg-[#F9F8F4] text-[#1A1A1A] rounded-bl-md'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content}
            {isStreaming && !isUser && (
              <span className="inline-block w-1.5 h-4 bg-[#0F4C5C] ml-0.5 animate-pulse" />
            )}
          </p>
        </div>
      </div>
    )
  }

  export default ChatMessage
  ```

  Key features:
  - User messages right-aligned with teal background
  - Assistant messages left-aligned with cream background
  - Streaming cursor (pulsing bar) when isStreaming=true
  - Rounded corners with chat bubble style
  </action>
  <verify>
  ```bash
  ls frontend/src/components/ai/
  grep -E "(export function|isStreaming)" frontend/src/components/ai/ChatMessage.tsx
  ```
  </verify>
  <done>ChatMessage component with user/assistant styling and streaming cursor</done>
</task>

<task type="auto">
  <name>Task 2: Create StarterPrompts component</name>
  <files>frontend/src/components/ai/StarterPrompts.tsx</files>
  <action>
  **frontend/src/components/ai/StarterPrompts.tsx:**
  ```typescript
  interface StarterPromptsProps {
    onSelect: (prompt: string) => void
  }

  const STARTER_PROMPTS = [
    'What should I budget for catering?',
    'How far in advance should I book vendors?',
    'What are the must-have vendor categories?',
    'Tips for choosing a venue in the Bay Area',
  ]

  export function StarterPrompts({ onSelect }: StarterPromptsProps) {
    return (
      <div className="px-4 pb-3 space-y-2">
        <p className="text-xs text-[#888888] font-medium">Try asking:</p>
        <div className="flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onSelect(prompt)}
              className="text-xs px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-full text-[#4A4A4A] hover:border-[#0F4C5C] hover:text-[#0F4C5C] transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  export default StarterPrompts
  ```

  Key features:
  - 4 Arangetram-specific starter prompts
  - Pill-shaped buttons with hover effect
  - onSelect callback sends prompt to chat
  </action>
  <verify>
  ```bash
  grep -E "(export function|STARTER_PROMPTS|onSelect)" frontend/src/components/ai/StarterPrompts.tsx
  ```
  </verify>
  <done>StarterPrompts component with clickable quick-start questions</done>
</task>

</tasks>

<verification>
- [ ] frontend/src/components/ai/ChatMessage.tsx exports ChatMessage
- [ ] frontend/src/components/ai/StarterPrompts.tsx exports StarterPrompts
- [ ] ChatMessage has distinct styling for user vs assistant
- [ ] ChatMessage shows streaming cursor when isStreaming=true
- [ ] StarterPrompts calls onSelect with prompt text on click
</verification>

<success_criteria>
Chat sub-components ready for ChatWidget:
- ChatMessage renders both roles with proper styling
- Streaming cursor visible during assistant response
- StarterPrompts clickable and calls onSelect
</success_criteria>

<output>
After completion, create `.planning/phases/04-ai-enhancement/04-03a-SUMMARY.md`
</output>
