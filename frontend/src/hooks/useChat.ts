import { useState, useCallback, useRef } from 'react'
import { fetchSSE, AI_ENDPOINTS } from '../lib/ai-client'
import type { Event } from './useEvents'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface UseChatOptions {
  eventContext?: Event | null
}

interface UseChatReturn {
  messages: ChatMessage[]
  isStreaming: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
}

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'Namaste! I can help you plan your Arangetram. Ask me about budgets, timelines, vendor categories, or anything else about your special day.',
}

export function useChat({ eventContext }: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return

    // Cancel any pending request
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    setError(null)
    setIsStreaming(true)

    // Add user message
    const userMessage: ChatMessage = { role: 'user', content: content.trim() }
    setMessages(prev => [...prev, userMessage])

    // Add placeholder for assistant response
    const assistantPlaceholder: ChatMessage = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantPlaceholder])

    try {
      await fetchSSE(
        AI_ENDPOINTS.chat,
        {
          message: content.trim(),
          eventContext: eventContext || undefined,
          history: messages.slice(-10), // Last 10 messages for context
        },
        (text) => {
          // Append streamed text to last message
          setMessages(prev => {
            const updated = [...prev]
            const lastIdx = updated.length - 1
            updated[lastIdx] = {
              ...updated[lastIdx],
              content: updated[lastIdx].content + text,
            }
            return updated
          })
        },
        abortControllerRef.current.signal
      )
    } catch (err) {
      if ((err as Error).name === 'AbortError') return

      setError((err as Error).message || 'Failed to get response')
      // Update placeholder with error message
      setMessages(prev => {
        const updated = [...prev]
        const lastIdx = updated.length - 1
        updated[lastIdx] = {
          ...updated[lastIdx],
          content: 'I apologize, but I encountered an issue. Please try again.',
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
    }
  }, [messages, isStreaming, eventContext])

  const clearMessages = useCallback(() => {
    abortControllerRef.current?.abort()
    setMessages([WELCOME_MESSAGE])
    setError(null)
  }, [])

  return { messages, isStreaming, error, sendMessage, clearMessages }
}
