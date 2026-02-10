import { createParser, type EventSourceParser } from 'eventsource-parser'
import { supabase } from './supabase'

// Edge Function endpoints
export const AI_ENDPOINTS = {
  chat: `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/ai-chat`,
  recommendations: `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/ai-recommendations`,
}

/**
 * Fetch with SSE streaming support
 * @param url - Edge Function URL
 * @param body - Request body
 * @param onChunk - Callback for each text chunk
 * @param signal - AbortSignal for cancellation
 */
export async function fetchSSE(
  url: string,
  body: Record<string, unknown>,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || ''

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || anonKey}`,
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()

  const parser = createParser({
    onEvent: (event) => {
      if (event.data === '[DONE]') return
      try {
        const { text } = JSON.parse(event.data)
        if (text) onChunk(text)
      } catch {
        // Ignore parse errors for malformed chunks
      }
    },
  })

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    parser.feed(decoder.decode(value, { stream: true }))
  }
}

/**
 * Fetch recommendations (non-streaming)
 */
export async function fetchRecommendations(eventId: string) {
  const { data: { session } } = await supabase.auth.getSession()
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || ''

  const response = await fetch(AI_ENDPOINTS.recommendations, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || anonKey}`,
    },
    body: JSON.stringify({ eventId }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}
