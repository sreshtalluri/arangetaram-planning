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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    // Reset textarea height after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
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
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              // Auto-resize: reset height then set to scrollHeight
              const ta = textareaRef.current
              if (ta) {
                ta.style.height = 'auto'
                ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about planning..."
            disabled={isStreaming}
            rows={1}
            className="flex-1 px-4 py-2.5 bg-[#F9F8F4] border border-[#E5E5E5] rounded-2xl text-sm focus:outline-none focus:border-[#0F4C5C] disabled:opacity-50 resize-none overflow-y-auto"
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
