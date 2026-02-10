# Phase 4: AI Enhancement - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

AI-powered vendor recommendations with explanations + chat assistant for planning questions. Users receive personalized vendor suggestions based on their event details, and can ask planning questions through a chat interface. Inquiry/booking functionality is Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Recommendation Display
- Grouped by category needed (Photographers, Caterers, etc.) — one section per category
- Top 3 vendors per category — curated, focused
- No match percentage or score — let explanation do the work
- Explanation inline, always visible (1-2 sentences on each card)
- Full vendor card: photo, name, category, price range, location, rating + explanation
- Dismiss button (X) on each recommendation — hides that vendor, shows next
- Recommendations appear on both user dashboard and discovery page
- When no event exists, show "Create an event to get personalized recommendations" prompt

### AI Explanation Style
- Direct & factual tone — "Matches your budget, available on your date, serves your area"
- Length: Claude's discretion based on match factors
- Highlight most relevant factor for each specific match (AI picks what's compelling)
- Be transparent about caveats — mention if notably outside budget or location

### Chat Assistant Behavior
- Floating button on all pages (bottom-right bubble, click to open)
- Concise responses (2-4 sentences) — users can ask follow-ups
- Starter prompts shown (e.g., "What should I budget for catering?") — helps new users
- Always use event context — answers personalized to their date, budget, location

### Loading & Performance UX
- Recommendations: Loading spinner with contextual message ("Finding vendors for your June Arangetram...")
- Chat: Streaming responses (word by word) — feels responsive
- On failure: Auto-retry once, then show error with "Try again" button

### Claude's Discretion
- Exact recommendation ranking algorithm
- Chat conversation memory implementation
- Specific starter prompts to show
- Error message wording

</decisions>

<specifics>
## Specific Ideas

- Recommendations should feel like a knowledgeable friend's suggestions, not an algorithm
- Chat should know about Arangetram-specific topics (typical budget ranges, timeline planning, cultural considerations)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-ai-enhancement*
*Context gathered: 2026-02-09*
