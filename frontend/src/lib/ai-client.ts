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
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || ''
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Your session has expired. Please log in again.')
  }
  const token = session.access_token

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': anonKey,
      'Authorization': `Bearer ${token}`,
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
        const parsed = JSON.parse(event.data)
        if (parsed.text) onChunk(parsed.text)
      } catch (parseError) {
        console.warn('Failed to parse SSE chunk:', event.data, parseError)
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
 * Uses supabase.functions.invoke() which passes the user's JWT automatically.
 */
export async function fetchRecommendations(eventId: string) {
  const { data, error } = await supabase.functions.invoke('ai-recommendations', {
    body: { eventId },
  })

  if (error) {
    throw new Error(error.message || 'Failed to fetch recommendations')
  }

  return data
}
