---
phase: 04-ai-enhancement
plan: 03b
type: execute
wave: 3
depends_on: ["04-03a"]
files_modified:
  - frontend/src/components/ai/ChatWidget.tsx
  - frontend/src/App.jsx
autonomous: false

must_haves:
  truths:
    - "Floating chat button visible on all pages (bottom-right)"
    - "Chat panel opens/closes on button click"
    - "Messages stream word-by-word when assistant responds"
    - "Chat widget accessible from any page via App.jsx integration"
  artifacts:
    - path: "frontend/src/components/ai/ChatWidget.tsx"
      provides: "Floating button + chat panel"
      exports: ["ChatWidget"]
  key_links:
    - from: "frontend/src/components/ai/ChatWidget.tsx"
      to: "useChat hook"
      via: "import and usage"
      pattern: "useChat"
    - from: "frontend/src/App.jsx"
      to: "ChatWidget component"
      via: "global render"
      pattern: "ChatWidget"
---

<objective>
Create ChatWidget with floating button and chat panel, integrate globally in App.jsx.

Purpose: Main chat widget that composes ChatMessage and StarterPrompts. Complex component with state management, streaming, auto-scroll.
Output: ChatWidget.tsx with full functionality, integrated into App.jsx.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/phases/04-ai-enhancement/04-CONTEXT.md
@.planning/phases/04-ai-enhancement/04-03a-SUMMARY.md
@frontend/src/App.jsx
@frontend/src/hooks/useEvents.ts
@frontend/src/hooks/useAuth.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create ChatWidget with floating button and panel</name>
  <files>frontend/src/components/ai/ChatWidget.tsx</files>
  <action>
  Create **frontend/src/components/ai/ChatWidget.tsx:**

  ```typescript
  import { useState, useRef, useEffect } from 'react'
  import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
  import { useChat } from '../../hooks/useChat'
  import { useEvents } from '../../hooks/useEvents'
  import { useAuth } from '../../hooks/useAuth'
  import { ChatMessage } from './ChatMessage'
  import { StarterPrompts } from './StarterPrompts'
  import { Button } from '../ui/button'

  export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [input, setInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Get user's first event for context
    const { user } = useAuth()
    const { data: events } = useEvents(user?.id)
    const eventContext = events?.[0] || null

    const { messages, isStreaming, sendMessage } = useChat({ eventContext })

    // Auto-scroll to bottom on new messages
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = () => {
      if (!input.trim() || isStreaming) return
      sendMessage(input)
      setInput('')
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    }

    // Floating button (closed state)
    if (!isOpen) {
      return (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#800020] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center z-50 transition-all"
          aria-label="Open AI Chat Assistant"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#C5A059] rounded-full animate-pulse" />
        </button>
      )
    }

    // Chat panel (open state)
    return (
      <div className="fixed bottom-6 right-6 w-[360px] h-[500px] bg-white rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#0F4C5C] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Arangetram Assistant</h3>
              <p className="text-xs text-white/70">Powered by AI</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, idx) => (
            <ChatMessage
              key={idx}
              message={msg}
              isStreaming={isStreaming && idx === messages.length - 1 && msg.role === 'assistant'}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Starter prompts (when few messages) */}
        {messages.length <= 2 && !isStreaming && (
          <StarterPrompts onSelect={sendMessage} />
        )}

        {/* Input area */}
        <div className="p-3 border-t border-[#E5E5E5] shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about planning..."
              disabled={isStreaming}
              className="flex-1 px-4 py-2.5 bg-[#F9F8F4] border border-[#E5E5E5] rounded-full text-sm focus:outline-none focus:border-[#0F4C5C] disabled:opacity-50"
            />
            <Button
              onClick={handleSend}
              disabled={isStreaming || !input.trim()}
              className="w-10 h-10 rounded-full bg-[#0F4C5C] hover:bg-[#093642] p-0 shrink-0"
              aria-label="Send message"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  export default ChatWidget
  ```

  Key features:
  - Floating button: burgundy (#800020), gold pulse indicator
  - Chat panel: 360x500px, fixed position bottom-right
  - Auto-scroll on new messages
  - Starter prompts when conversation is new
  - Enter to send, Shift+Enter for newline
  - Loading spinner during streaming
  </action>
  <verify>
  ```bash
  grep -E "(export function|useChat|isOpen|StarterPrompts)" frontend/src/components/ai/ChatWidget.tsx
  ```
  </verify>
  <done>ChatWidget component with floating button, chat panel, streaming indicator, and starter prompts</done>
</task>

<task type="auto">
  <name>Task 2: Integrate ChatWidget globally in App.jsx</name>
  <files>frontend/src/App.jsx</files>
  <action>
  Update App.jsx to render ChatWidget on all pages:

  1. Add import at top of file:
     ```jsx
     import { ChatWidget } from './components/ai/ChatWidget'
     ```

  2. Render ChatWidget inside the Router but outside Routes, so it appears on all pages:
     - Find the existing `<Router>` component
     - Add `<ChatWidget />` after `<Routes>...</Routes>` but before closing `</Router>`
     - This ensures the floating button is always visible

  Example structure:
  ```jsx
  <Router>
    <Routes>
      {/* existing routes */}
    </Routes>
    <Toaster />
    <ChatWidget />
  </Router>
  ```

  3. Remove or comment out any old AIChat usage if present (the old component is no longer needed)
  </action>
  <verify>
  ```bash
  grep -E "(ChatWidget|import.*ChatWidget)" frontend/src/App.jsx
  ```
  </verify>
  <done>ChatWidget rendered globally in App.jsx, visible on all pages</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Floating chat widget with streaming responses on all pages</what-built>
  <how-to-verify>
  1. Start the frontend dev server:
     ```bash
     cd frontend && yarn start
     ```

  2. Open http://localhost:3000 in browser

  3. Verify floating button:
     - Chat bubble button visible in bottom-right corner
     - Has gold animated pulse indicator

  4. Click the button to open chat panel:
     - Panel slides in with header "Arangetram Assistant"
     - Welcome message displayed
     - Starter prompts shown below messages

  5. Click a starter prompt (e.g., "What should I budget for catering?"):
     - User message appears
     - Assistant response streams in word-by-word (not all at once)
     - Cursor indicator pulses while streaming

  6. Type a custom message and press Enter:
     - Message sends and response streams

  7. Test on different pages (Dashboard, Vendors, etc.):
     - Chat widget persists across navigation
     - Conversation history maintained

  Expected: Responsive chat widget that streams AI responses in real-time.
  </how-to-verify>
  <resume-signal>Type "approved" if chat works correctly, or describe any issues</resume-signal>
</task>

</tasks>

<verification>
- [ ] frontend/src/components/ai/ChatWidget.tsx exports ChatWidget
- [ ] ChatWidget uses useChat hook for streaming
- [ ] ChatWidget uses useEvents to pass event context
- [ ] ChatWidget composes ChatMessage and StarterPrompts
- [ ] App.jsx imports and renders ChatWidget
- [ ] Chat button visible on all pages
- [ ] Streaming works (word-by-word response)
</verification>

<success_criteria>
Chat widget functional on all pages:
- Floating button visible (bottom-right)
- Panel opens/closes correctly
- Starter prompts clickable
- Responses stream word-by-word
- Event context passed to AI (if user has event)
</success_criteria>

<output>
After completion, create `.planning/phases/04-ai-enhancement/04-03b-SUMMARY.md`
</output>
