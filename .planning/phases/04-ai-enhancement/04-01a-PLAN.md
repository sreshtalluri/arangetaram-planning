---
phase: 04-ai-enhancement
plan: 01a
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/functions/_shared/claude-client.ts
  - supabase/functions/_shared/prompts/chat-system.ts
  - supabase/functions/ai-chat/index.ts
autonomous: true
user_setup:
  - service: anthropic
    why: "Claude API for AI recommendations and chat"
    env_vars:
      - name: ANTHROPIC_API_KEY
        source: "Anthropic Console -> API Keys -> Create Key"
    dashboard_config:
      - task: "Add ANTHROPIC_API_KEY to Supabase Edge Function secrets"
        location: "Supabase Dashboard -> Project Settings -> Edge Functions -> Secrets"

must_haves:
  truths:
    - "Edge function ai-chat streams Claude responses via SSE"
    - "Shared Claude client is reusable across functions"
    - "Prompt caching is enabled for system prompts (cost optimization)"
  artifacts:
    - path: "supabase/functions/_shared/claude-client.ts"
      provides: "Anthropic SDK client factory"
      exports: ["createClaudeClient", "corsHeaders"]
    - path: "supabase/functions/_shared/prompts/chat-system.ts"
      provides: "Chat assistant system prompt"
      exports: ["CHAT_SYSTEM_PROMPT"]
    - path: "supabase/functions/ai-chat/index.ts"
      provides: "Streaming chat endpoint"
      contains: "Deno.serve"
  key_links:
    - from: "supabase/functions/ai-chat/index.ts"
      to: "Anthropic SDK"
      via: "createClaudeClient import"
      pattern: "import.*claude-client"
---

<objective>
Create shared Claude client and ai-chat Edge Function with SSE streaming.

Purpose: Reusable Claude infrastructure plus the chat endpoint. Chat is simpler (direct streaming) so it ships first.
Output: Shared client, chat system prompt, and deployed ai-chat function.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/04-ai-enhancement/04-CONTEXT.md
@.planning/phases/04-ai-enhancement/04-RESEARCH.md
@supabase/config.toml
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create shared Claude client and CORS headers</name>
  <files>supabase/functions/_shared/claude-client.ts</files>
  <action>
  Create the shared directory and Claude client factory:

  ```bash
  mkdir -p supabase/functions/_shared/prompts
  ```

  **supabase/functions/_shared/claude-client.ts:**
  - Import Anthropic from `npm:@anthropic-ai/sdk@^0.27.0`
  - Export `createClaudeClient()` factory function that:
    - Gets API key from `Deno.env.get('ANTHROPIC_API_KEY')`
    - Returns configured Anthropic client instance
  - Export CORS headers constant for reuse:
    ```typescript
    export const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }
    ```
  </action>
  <verify>
  ```bash
  cat supabase/functions/_shared/claude-client.ts | grep -E "(export|createClaudeClient|corsHeaders)"
  ```
  </verify>
  <done>Shared Claude client factory and CORS headers exported from _shared directory</done>
</task>

<task type="auto">
  <name>Task 2: Create chat system prompt and ai-chat Edge Function</name>
  <files>
    supabase/functions/_shared/prompts/chat-system.ts
    supabase/functions/ai-chat/index.ts
  </files>
  <action>
  **supabase/functions/_shared/prompts/chat-system.ts:**
  - Export `CHAT_SYSTEM_PROMPT` string using XML structure:
    - `<role>`: Arangetram planning assistant
    - `<behavior>`: Concise (2-4 sentences), factual tone, ask clarifying questions
    - `<knowledge>`: Typical budget $15k-50k, key categories, 8-12 month planning timeline, Bay Area focus
    - `<constraints>`: Don't make up vendor names, don't promise availability, recommend using vendor discovery

  **supabase/functions/ai-chat/index.ts:**
  - Import Deno.serve
  - Import createClaudeClient and corsHeaders from ../_shared/claude-client.ts
  - Import CHAT_SYSTEM_PROMPT from ../_shared/prompts/chat-system.ts

  Handle CORS preflight (OPTIONS request -> return 200 with corsHeaders)

  Main handler:
  1. Parse JSON body: `{ message: string, eventContext?: Event, history?: Message[] }`
  2. Get Anthropic client via createClaudeClient()
  3. Build messages array:
     - If eventContext provided, prepend user message with event details (date, budget, location, categories)
     - Include last 10 messages from history
     - Add current message
  4. Call `anthropic.messages.stream()` with:
     - model: 'claude-sonnet-4-5-20250929'
     - max_tokens: 1024
     - system: `[{ type: 'text', text: CHAT_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }]`
     - messages array
  5. Create ReadableStream that:
     - Iterates over stream events
     - On 'content_block_delta', writes `data: ${JSON.stringify({ text })}\n\n`
     - On completion, writes `data: [DONE]\n\n` and closes
  6. Return Response with body=stream, Content-Type: text/event-stream, corsHeaders

  Error handling: Catch errors, return 500 with JSON error message and corsHeaders
  </action>
  <verify>
  ```bash
  cat supabase/functions/_shared/prompts/chat-system.ts | grep "CHAT_SYSTEM_PROMPT"
  cat supabase/functions/ai-chat/index.ts | grep -E "(Deno.serve|messages.stream|text/event-stream)"
  ```
  </verify>
  <done>Chat system prompt and ai-chat Edge Function with SSE streaming created</done>
</task>

</tasks>

<verification>
- [ ] supabase/functions/_shared/claude-client.ts exports createClaudeClient and corsHeaders
- [ ] supabase/functions/_shared/prompts/chat-system.ts exports CHAT_SYSTEM_PROMPT
- [ ] supabase/functions/ai-chat/index.ts uses streaming with SSE
- [ ] ai-chat handles CORS preflight
- [ ] ai-chat uses prompt caching (cache_control: { type: 'ephemeral' })
</verification>

<success_criteria>
ai-chat Edge Function created with:
- Shared Claude client factory in place
- Chat system prompt with XML structure
- SSE streaming response format
- CORS headers for frontend access
</success_criteria>

<output>
After completion, create `.planning/phases/04-ai-enhancement/04-01a-SUMMARY.md`
</output>
