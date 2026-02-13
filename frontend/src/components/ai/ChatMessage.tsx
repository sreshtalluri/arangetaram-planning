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
        className={`max-w-[85%] min-w-0 rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'bg-[#0F4C5C] text-white rounded-br-md'
            : 'bg-[#F9F8F4] text-[#1A1A1A] rounded-bl-md'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere leading-relaxed" style={{ overflowWrap: 'anywhere' }}>
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
