# Phase 4: AI Enhancement - Research

**Researched:** 2026-02-09
**Domain:** AI Integration (Claude API + React Chat + Supabase Edge Functions)
**Confidence:** HIGH

## Summary

Phase 4 implements AI-powered vendor recommendations and a chat assistant for Arangetram planning. The core architecture involves Supabase Edge Functions as the backend AI layer, communicating with Claude's Messages API via the `@anthropic-ai/sdk`, and a React frontend with streaming chat UI using Server-Sent Events (SSE).

The hybrid recommendation approach (database filter then AI ranking) is well-established and aligns with modern best practices. The existing codebase already has a basic `AIChat.jsx` component and API client structure that can be enhanced with streaming support and better state management.

**Primary recommendation:** Use Supabase Edge Functions with the Anthropic TypeScript SDK for all Claude API calls. Implement streaming for chat using SSE, and use React Query for recommendation caching. Leverage Claude's prompt caching for cost optimization on repeated system prompts.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/sdk | latest | Claude API client | Official TypeScript SDK, streaming support, type safety |
| Supabase Edge Functions | Deno runtime | Backend AI layer | Already in stack, handles secrets, CORS, auth |
| eventsource-parser | ^3.0.0 | Parse SSE streams | De-facto standard for SSE parsing, 500+ dependents |
| @tanstack/react-query | ^5.x (already installed) | State management | Already in stack, handles caching, optimistic updates |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | ^3.x (already installed) | Request validation | Validate AI request payloads before sending |
| date-fns | ^4.x (already installed) | Date formatting | Format event dates for AI context |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Edge Functions | Python FastAPI backend | Already have both; Edge Functions closer to Supabase data |
| eventsource-parser | Native EventSource | Native doesn't handle POST requests; parser more flexible |
| Custom chat UI | @chatscope/chat-ui-kit-react | Heavier dependency, less control over Arangetram styling |

**Installation:**
```bash
# In frontend/
npm install eventsource-parser

# Edge Functions use Deno - no npm install needed
# Anthropic SDK imported directly in Edge Function via Deno
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
├── components/
│   └── ai/
│       ├── ChatWidget.tsx        # Floating button + chat panel
│       ├── ChatMessage.tsx       # Individual message with streaming
│       ├── StarterPrompts.tsx    # Quick action prompts
│       └── RecommendationCard.tsx # Vendor rec with AI explanation
├── hooks/
│   ├── useChat.ts               # Chat state + streaming logic
│   └── useRecommendations.ts    # Hybrid rec fetching
└── lib/
    └── ai-client.ts             # SSE fetch helpers

supabase/functions/
├── ai-chat/
│   └── index.ts                 # Chat endpoint with streaming
├── ai-recommendations/
│   └── index.ts                 # Hybrid recommendation endpoint
└── _shared/
    ├── claude-client.ts         # Anthropic SDK setup
    └── prompts/
        ├── chat-system.ts       # Chat assistant system prompt
        └── recommendation.ts     # Recommendation ranking prompt
```

### Pattern 1: Hybrid Recommendations (Database Filter + AI Ranking)
**What:** First filter vendors from database, then use Claude to rank and explain
**When to use:** AI-01, AI-02, AI-03, AI-05 - vendor recommendations
**Example:**
```typescript
// Source: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
// In supabase/functions/ai-recommendations/index.ts

import Anthropic from 'npm:@anthropic-ai/sdk';

// Step 1: Database filtering (fast, cheap)
const candidateVendors = await supabase
  .from('vendor_profiles')
  .select('*')
  .eq('is_published', true)
  .contains('service_areas', [event.location])
  .lte('price_min', event.budget)
  .in('category', event.categories_needed);

// Step 2: AI ranking (intelligent, personalized)
const anthropic = new Anthropic();
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 2048,
  system: [
    {
      type: 'text',
      text: RECOMMENDATION_SYSTEM_PROMPT,
      cache_control: { type: 'ephemeral' } // Cache system prompt
    }
  ],
  messages: [
    {
      role: 'user',
      content: `Event: ${JSON.stringify(eventContext)}
Candidates: ${JSON.stringify(candidateVendors)}
Return top 3 per category with explanations.`
    }
  ]
});
```

### Pattern 2: Streaming Chat with SSE
**What:** Stream Claude responses word-by-word to frontend
**When to use:** CHAT-01, CHAT-02, CHAT-03 - chat assistant
**Example:**
```typescript
// Source: https://platform.claude.com/docs/en/api/messages-streaming
// In supabase/functions/ai-chat/index.ts

import Anthropic from 'npm:@anthropic-ai/sdk';

Deno.serve(async (req) => {
  const { message, eventContext, history } = await req.json();

  const anthropic = new Anthropic({
    apiKey: Deno.env.get('ANTHROPIC_API_KEY')
  });

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: CHAT_SYSTEM_PROMPT,
    messages: [
      ...history,
      { role: 'user', content: message }
    ]
  });

  // Create SSE response
  const body = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          const text = event.delta.text || '';
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`)
          );
        }
      }
      controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
      controller.close();
    }
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    }
  });
});
```

### Pattern 3: Frontend SSE Consumption
**What:** React hook for consuming streaming responses
**When to use:** Chat message display with word-by-word streaming
**Example:**
```typescript
// Source: https://github.com/rexxars/eventsource-parser
// In frontend/src/hooks/useChat.ts

import { createParser } from 'eventsource-parser';

export function useChat(eventContext: Event | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = async (content: string) => {
    setIsStreaming(true);
    setMessages(prev => [...prev, { role: 'user', content }]);

    // Add placeholder for assistant response
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({
        message: content,
        eventContext,
        history: messages.slice(-10) // Last 10 messages for context
      })
    });

    const parser = createParser({
      onEvent: (event) => {
        if (event.data === '[DONE]') {
          setIsStreaming(false);
          return;
        }
        const { text } = JSON.parse(event.data);
        // Append to last message (assistant placeholder)
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content += text;
          return updated;
        });
      }
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      parser.feed(decoder.decode(value));
    }
  };

  return { messages, sendMessage, isStreaming };
}
```

### Pattern 4: Conversation History Management
**What:** Maintain chat context within session
**When to use:** CHAT-04 - conversation history
**Example:**
```typescript
// In frontend/src/hooks/useChat.ts

// Session-based storage (not persisted across page refreshes)
const [messages, setMessages] = useState<Message[]>(() => {
  // Initial welcome message
  return [{
    role: 'assistant',
    content: 'Namaste! I can help you plan your Arangetram...'
  }];
});

// Trim history for API calls (token efficiency)
const getHistoryForAPI = () => {
  return messages.slice(-10); // Last 10 messages
};
```

### Anti-Patterns to Avoid
- **Exposing API key in frontend:** Never put ANTHROPIC_API_KEY in React code; always use Edge Functions
- **Sending entire vendor database to Claude:** Filter first, then rank - AI should see 10-20 candidates, not hundreds
- **Not handling stream errors:** Always implement retry logic and error states for streaming
- **Blocking UI during AI calls:** Use streaming for chat; show loading skeleton for recommendations

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSE parsing | Custom string parsing | eventsource-parser | Handles edge cases, reconnection, spec compliance |
| Rate limiting | setTimeout retries | SDK built-in retries | Anthropic SDK handles 429s with exponential backoff |
| Token counting | Estimate by characters | SDK usage response | Claude returns exact token counts in response |
| Prompt templating | String concatenation | XML tags + cache | Claude trained on XML structure, caching saves cost |
| Chat state | Custom context | React useState + trimming | Simple is sufficient for session-based history |

**Key insight:** The Anthropic SDK handles retry logic, streaming, and error handling. Focus on UX and prompt engineering, not low-level API handling.

## Common Pitfalls

### Pitfall 1: API Key Exposure
**What goes wrong:** ANTHROPIC_API_KEY ends up in frontend bundle
**Why it happens:** Developers try to call Claude directly from React
**How to avoid:** Always route through Supabase Edge Functions; key in Supabase secrets
**Warning signs:** Environment variables starting with REACT_APP_ANTHROPIC

### Pitfall 2: Streaming Without Error Handling
**What goes wrong:** User sees frozen UI when stream fails
**Why it happens:** fetch() doesn't throw on HTTP errors with streams
**How to avoid:** Check response.ok before reading stream; implement timeout
**Warning signs:** Silent failures, no "Try again" button

### Pitfall 3: Unbounded Conversation History
**What goes wrong:** Token limits exceeded, costs balloon
**Why it happens:** Sending entire chat history to every request
**How to avoid:** Trim to last 10 messages; summarize older context if needed
**Warning signs:** Slow responses, API errors about context length

### Pitfall 4: Expensive Repeated Prompts
**What goes wrong:** High API costs from identical system prompts
**Why it happens:** Not using prompt caching for static content
**How to avoid:** Use `cache_control: { type: 'ephemeral' }` on system prompts
**Warning signs:** cache_read_input_tokens always 0 in usage

### Pitfall 5: Blocking Recommendations UI
**What goes wrong:** User waits 2-3 seconds with no feedback
**Why it happens:** Waiting for full AI response before rendering
**How to avoid:** Show loading spinner with contextual message; consider skeleton cards
**Warning signs:** Empty recommendation section for several seconds

## Code Examples

Verified patterns from official sources:

### Edge Function Setup with Anthropic SDK
```typescript
// Source: https://github.com/anthropics/anthropic-sdk-typescript
// In supabase/functions/ai-chat/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Anthropic from 'npm:@anthropic-ai/sdk@^0.27.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')!
    });

    // ... rest of handler
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### System Prompt for Arangetram Assistant
```typescript
// Source: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
// In supabase/functions/_shared/prompts/chat-system.ts

export const CHAT_SYSTEM_PROMPT = `You are a knowledgeable Arangetram planning assistant.

<role>
You help families plan Arangetram (solo debut) performances for Bharatanatyam and other Indian classical dance forms.
</role>

<behavior>
- Be concise (2-4 sentences per response)
- Use factual, direct tone
- Include specific numbers when discussing budgets or timelines
- Ask clarifying questions when needed
- Reference the user's event details when available
</behavior>

<knowledge>
- Typical Arangetram budget: $15,000-$50,000 total
- Key vendor categories: Venue, Caterer, Photographer, Videographer, Makeup Artist, Nattuvanar
- Timeline: Start planning 8-12 months ahead
- Bay Area specific venues and vendor networks
</knowledge>

<constraints>
- Do not make up vendor names or prices
- Do not promise availability
- Recommend using the app's vendor discovery for specific suggestions
</constraints>`;
```

### Floating Chat Widget Component
```tsx
// Source: https://floating-ui.com/docs/react
// In frontend/src/components/ai/ChatWidget.tsx

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useEvent } from '../../hooks/useEvents';
import ChatMessage from './ChatMessage';
import StarterPrompts from './StarterPrompts';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: event } = useEvent(/* current event ID */);
  const { messages, sendMessage, isStreaming } = useChat(event);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-[#800020] text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center z-50"
        aria-label="Open AI Chat Assistant"
      >
        <MessageCircle className="w-7 h-7" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="p-4 bg-[#0F4C5C] text-white rounded-t-lg flex justify-between">
        <span className="font-semibold">Arangetram Assistant</span>
        <button onClick={() => setIsOpen(false)}><X className="w-5 h-5" /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {isStreaming && <div className="text-gray-400">...</div>}
      </div>

      {/* Starter prompts (when few messages) */}
      {messages.length <= 1 && (
        <StarterPrompts onSelect={sendMessage} />
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <input
          type="text"
          placeholder="Ask about planning..."
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(e.target.value)}
          className="w-full px-4 py-2 border rounded-full"
        />
      </div>
    </div>
  );
}
```

### Recommendation Request with Event Context
```typescript
// In frontend/src/hooks/useRecommendations.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useRecommendations(eventId: string | undefined) {
  return useQuery({
    queryKey: ['recommendations', eventId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-recommendations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ eventId })
        }
      );

      if (!response.ok) throw new Error('Failed to get recommendations');
      return response.json();
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1 // Auto-retry once on failure
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Beta prompt caching | GA prompt caching | Dec 2024 | No beta header needed, 90% cost savings |
| client.beta.promptCaching | client.messages.create | Dec 2024 | Simpler SDK usage |
| Streaming with beta header | Streaming GA | 2025 | Fine-grained tool streaming available |
| OpenAI-style APIs | Native Anthropic SDK | 2024 | Better typing, streaming, error handling |

**Deprecated/outdated:**
- `client.beta.promptCaching.messages.create()`: Use `client.messages.create()` directly
- Anthropic-beta header for streaming: No longer needed
- claude-3-sonnet-20240229: Use claude-sonnet-4-5-20250929 (latest)

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal max_tokens for recommendations**
   - What we know: Need enough tokens for 3 vendors per category with explanations
   - What's unclear: Exact token count needed (varies by explanation length)
   - Recommendation: Start with 2048, adjust based on actual usage

2. **Conversation history summarization**
   - What we know: 10 messages is reasonable limit for context
   - What's unclear: Whether to summarize older messages or just drop them
   - Recommendation: Start with simple truncation, add summarization if users complain

3. **Dismissed recommendation persistence**
   - What we know: CONTEXT.md says dismiss button hides vendor, shows next
   - What's unclear: Whether dismissals persist across sessions
   - Recommendation: Use session state initially, add database persistence if needed

## Sources

### Primary (HIGH confidence)
- [Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript) - Installation, streaming, messages API
- [Claude Streaming Documentation](https://platform.claude.com/docs/en/api/messages-streaming) - SSE event types, streaming patterns
- [Claude Prompt Caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) - Cache control, pricing, best practices
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions) - Deno runtime, secrets, CORS

### Secondary (MEDIUM confidence)
- [eventsource-parser NPM](https://www.npmjs.com/package/eventsource-parser) - SSE parsing library
- [Floating UI React](https://floating-ui.com/docs/react) - Floating chat widget patterns
- [React Chat UI Patterns](https://github.com/chatscope/chat-ui-kit-react) - Chat component structure (v2.1.1)

### Tertiary (LOW confidence)
- [Hybrid Recommendation Systems](https://medium.com/@Emar7/building-a-hybrid-recommendation-system-combining-collaborative-filtering-content-based-and-6be4e400ec3c) - Filter-then-rank pattern validation
- SSE Best Practices 2026 - Community patterns for streaming chat

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official SDK docs, existing app patterns
- Architecture: HIGH - Official streaming docs, established patterns
- Pitfalls: HIGH - Documented in SDK issues, common developer experience

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (30 days - Anthropic SDK stable, Edge Functions stable)
