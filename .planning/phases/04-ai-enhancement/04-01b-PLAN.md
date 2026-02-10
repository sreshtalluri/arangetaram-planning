---
phase: 04-ai-enhancement
plan: 01b
type: execute
wave: 1
depends_on: ["04-01a"]
files_modified:
  - supabase/functions/_shared/prompts/recommendation.ts
  - supabase/functions/ai-recommendations/index.ts
autonomous: false

must_haves:
  truths:
    - "Edge function ai-recommendations returns ranked vendors with explanations"
    - "Hybrid approach: database filter then AI ranking"
    - "Top 3 vendors per category with 1-2 sentence explanations"
  artifacts:
    - path: "supabase/functions/_shared/prompts/recommendation.ts"
      provides: "Recommendation ranking prompt"
      exports: ["RECOMMENDATION_SYSTEM_PROMPT"]
    - path: "supabase/functions/ai-recommendations/index.ts"
      provides: "Hybrid recommendation endpoint"
      contains: "Deno.serve"
  key_links:
    - from: "supabase/functions/ai-recommendations/index.ts"
      to: "vendor_profiles table"
      via: "Supabase query before AI ranking"
      pattern: "from\\('vendor_profiles'\\)"
    - from: "supabase/functions/ai-recommendations/index.ts"
      to: "claude-client"
      via: "createClaudeClient import"
      pattern: "import.*claude-client"
---

<objective>
Create ai-recommendations Edge Function with hybrid database filter + AI ranking.

Purpose: Complex recommendation logic (query DB, filter, then rank with AI) in its own focused plan.
Output: Recommendation prompt and deployed ai-recommendations function.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/phases/04-ai-enhancement/04-CONTEXT.md
@.planning/phases/04-ai-enhancement/04-RESEARCH.md
@.planning/phases/04-ai-enhancement/04-01a-SUMMARY.md
@supabase/config.toml
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create recommendation prompt</name>
  <files>supabase/functions/_shared/prompts/recommendation.ts</files>
  <action>
  **supabase/functions/_shared/prompts/recommendation.ts:**
  - Export `RECOMMENDATION_SYSTEM_PROMPT` string that instructs Claude to:
    - Rank vendor candidates by fit for the event
    - Return top 3 per category
    - Provide 1-2 sentence explanation for each (factual: budget match, location, availability)
    - Use JSON output format with structure: `{ categories: { [category]: { vendors: [{ id, explanation }] } } }`
  </action>
  <verify>
  ```bash
  cat supabase/functions/_shared/prompts/recommendation.ts | grep "RECOMMENDATION_SYSTEM_PROMPT"
  ```
  </verify>
  <done>Recommendation system prompt exported with JSON output format</done>
</task>

<task type="auto">
  <name>Task 2: Create ai-recommendations Edge Function with hybrid approach</name>
  <files>supabase/functions/ai-recommendations/index.ts</files>
  <action>
  Create the recommendations Edge Function with hybrid filter + AI ranking:

  **supabase/functions/ai-recommendations/index.ts:**
  - Import Deno.serve, createClient from @supabase/supabase-js
  - Import createClaudeClient, corsHeaders from ../_shared/claude-client.ts
  - Import RECOMMENDATION_SYSTEM_PROMPT from ../_shared/prompts/recommendation.ts

  Handle CORS preflight

  Main handler:
  1. Parse JSON body: `{ eventId: string }`
  2. Get auth token from Authorization header
  3. Create Supabase client with service role key (from env)

  **Step 1 - Fetch event:**
  - Query events table by eventId to get: event_date, location, budget, categories_needed
  - Return 404 if not found

  **Step 2 - Database filter (fast, cheap):**
  - Query vendor_profiles where:
    - is_published = true
    - category IN event.categories_needed
    - service_areas contains event.location (if specified)
    - price_min <= event.budget (if specified)
  - Also check vendor_availability to exclude blocked vendors for event_date
  - Limit to 10 candidates per category (to keep AI costs low)

  **Step 3 - AI ranking (intelligent):**
  - Call anthropic.messages.create() with:
    - model: 'claude-sonnet-4-5-20250929'
    - max_tokens: 2048
    - system: `[{ type: 'text', text: RECOMMENDATION_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }]`
    - messages: User message with JSON of event context + candidate vendors
  - Parse JSON response to get ranked vendors with explanations

  **Step 4 - Return enriched results:**
  - Map AI rankings back to full vendor data
  - Return JSON: `{ categories: { [category]: { vendors: [{ ...vendorData, aiExplanation }] } } }`

  Error handling: Catch errors, return appropriate status codes
  </action>
  <verify>
  ```bash
  cat supabase/functions/ai-recommendations/index.ts | grep -E "(from\\('vendor_profiles'\\)|from\\('events'\\)|messages.create)"
  ```
  </verify>
  <done>ai-recommendations Edge Function with database filter then AI ranking</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Two Supabase Edge Functions for AI chat and recommendations</what-built>
  <how-to-verify>
  1. Add ANTHROPIC_API_KEY to Supabase secrets:
     - Go to Supabase Dashboard -> Project Settings -> Edge Functions -> Secrets
     - Add secret: ANTHROPIC_API_KEY = [your Anthropic API key]

  2. Deploy Edge Functions:
     ```bash
     cd /Users/sreshtalluri/Documents/Github/arangetaram-planning
     npx supabase functions deploy ai-chat
     npx supabase functions deploy ai-recommendations
     ```

  3. Test ai-chat function (should stream response):
     ```bash
     curl -N -X POST 'https://[project-ref].supabase.co/functions/v1/ai-chat' \
       -H 'Content-Type: application/json' \
       -H 'Authorization: Bearer [anon-key]' \
       -d '{"message": "What should I budget for catering?"}'
     ```

  4. Verify streaming works (words appear one by one in response)

  Expected: SSE stream with `data: {"text":"..."}` chunks, ending with `data: [DONE]`
  </how-to-verify>
  <resume-signal>Type "approved" to continue or describe any issues with deployment</resume-signal>
</task>

</tasks>

<verification>
- [ ] supabase/functions/_shared/prompts/recommendation.ts exports RECOMMENDATION_SYSTEM_PROMPT
- [ ] supabase/functions/ai-recommendations/index.ts does database filter then AI ranking
- [ ] ai-recommendations handles CORS preflight
- [ ] ai-recommendations uses prompt caching (cache_control: { type: 'ephemeral' })
- [ ] Both Edge Functions deploy successfully
</verification>

<success_criteria>
Edge Functions deployed and responding:
- ai-chat returns streaming SSE response
- ai-recommendations returns JSON with ranked vendors
- ANTHROPIC_API_KEY is set in Supabase secrets
</success_criteria>

<output>
After completion, create `.planning/phases/04-ai-enhancement/04-01b-SUMMARY.md`
</output>
