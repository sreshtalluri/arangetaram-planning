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
  const token = await getFreshToken()

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
 * Get a fresh access token, refreshing if needed.
 * Throws if user is not authenticated — edge functions require a valid JWT.
 */
async function getFreshToken(): Promise<string> {
  // Try getting current session first
  const { data: { session } } = await supabase.auth.getSession()

  if (session?.access_token) {
    // Check if token expires within 60 seconds
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
    if (expiresAt > Date.now() + 60_000) {
      return session.access_token
    }

    // Token is stale — refresh it
    const { data: refreshed } = await supabase.auth.refreshSession()
    if (refreshed.session?.access_token) {
      return refreshed.session.access_token
    }
  }

  throw new Error('Not authenticated — please log in to use this feature')
}

/**
 * Fetch recommendations (non-streaming)
 */
export async function fetchRecommendations(eventId: string) {
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || ''
  const token = await getFreshToken()

  const response = await fetch(AI_ENDPOINTS.recommendations, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': anonKey,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ eventId }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}
