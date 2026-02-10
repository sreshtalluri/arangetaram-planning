import { createClient } from 'jsr:@supabase/supabase-js@2';
import { createClaudeClient, corsHeaders } from '../_shared/claude-client.ts';
import { RECOMMENDATION_SYSTEM_PROMPT } from '../_shared/prompts/recommendation.ts';

interface Event {
  id: string;
  event_date: string;
  location?: string;
  budget?: number;
  categories_needed: string[];
}

interface VendorProfile {
  id: string;
  business_name: string;
  description?: string;
  category: string;
  service_areas: string[];
  price_min?: number;
  price_max?: number;
  profile_photo_url?: string;
}

interface RecommendationRequest {
  eventId: string;
}

interface VendorRecommendation {
  id: string;
  explanation: string;
}

interface CategoryRecommendations {
  vendors: VendorRecommendation[];
}

interface AIResponse {
  categories: {
    [category: string]: CategoryRecommendations;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request body
    const { eventId }: RecommendationRequest = await req.json();

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: 'eventId is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with service role key for admin access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Step 1: Fetch event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, event_date, location, budget, categories_needed')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const eventData = event as Event;

    if (!eventData.categories_needed || eventData.categories_needed.length === 0) {
      return new Response(
        JSON.stringify({
          categories: {},
          message: 'No categories needed for this event',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 2: Database filter - get candidate vendors per category
    const candidatesByCategory: { [category: string]: VendorProfile[] } = {};

    for (const category of eventData.categories_needed) {
      // Build query with filters
      let query = supabase
        .from('vendor_profiles')
        .select('id, business_name, description, category, service_areas, price_min, price_max, profile_photo_url')
        .eq('is_published', true)
        .eq('category', category);

      // Filter by service area if location specified
      if (eventData.location) {
        query = query.contains('service_areas', [eventData.location]);
      }

      // Filter by budget if specified (price_min should be <= budget)
      if (eventData.budget) {
        query = query.lte('price_min', eventData.budget);
      }

      // Limit to 10 candidates per category to keep AI costs low
      query = query.limit(10);

      const { data: vendors, error: vendorsError } = await query;

      if (vendorsError) {
        console.error(`Error fetching vendors for category ${category}:`, vendorsError);
        continue;
      }

      if (!vendors || vendors.length === 0) {
        candidatesByCategory[category] = [];
        continue;
      }

      const vendorProfiles = vendors as VendorProfile[];

      // Check availability - exclude vendors blocked on event date
      if (eventData.event_date) {
        const vendorIds = vendorProfiles.map(v => v.id);

        const { data: blockedVendors } = await supabase
          .from('vendor_availability')
          .select('vendor_id')
          .in('vendor_id', vendorIds)
          .eq('blocked_date', eventData.event_date);

        const blockedVendorIds = new Set(
          (blockedVendors || []).map(b => b.vendor_id)
        );

        // Filter out blocked vendors
        candidatesByCategory[category] = vendorProfiles.filter(
          v => !blockedVendorIds.has(v.id)
        );
      } else {
        candidatesByCategory[category] = vendorProfiles;
      }
    }

    // Check if we have any candidates
    const totalCandidates = Object.values(candidatesByCategory).reduce(
      (sum, vendors) => sum + vendors.length,
      0
    );

    if (totalCandidates === 0) {
      return new Response(
        JSON.stringify({
          categories: {},
          message: 'No vendors found matching event criteria',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 3: AI ranking
    const anthropic = createClaudeClient();

    // Build context for AI
    const eventContext = {
      date: eventData.event_date,
      location: eventData.location || 'Not specified',
      budget: eventData.budget || 'Not specified',
      categories_needed: eventData.categories_needed,
    };

    // Build candidate summary
    const candidateSummary: { [category: string]: any[] } = {};
    for (const [category, vendors] of Object.entries(candidatesByCategory)) {
      candidateSummary[category] = vendors.map(v => ({
        id: v.id,
        business_name: v.business_name,
        description: v.description || '',
        service_areas: v.service_areas,
        price_range: v.price_min && v.price_max
          ? `$${v.price_min} - $${v.price_max}`
          : v.price_min
          ? `Starting at $${v.price_min}`
          : 'Contact for pricing',
      }));
    }

    const userMessage = `Event Context:
${JSON.stringify(eventContext, null, 2)}

Candidate Vendors by Category:
${JSON.stringify(candidateSummary, null, 2)}

Please rank and return the top 3 vendors per category with explanations.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: RECOMMENDATION_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // Extract text from response
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in AI response');
    }

    // Parse AI response JSON
    let aiRecommendations: AIResponse;
    try {
      aiRecommendations = JSON.parse(textContent.text);
    } catch (parseError) {
      console.error('Failed to parse AI response:', textContent.text);
      throw new Error('Invalid AI response format');
    }

    // Step 4: Enrich AI rankings with full vendor data
    const enrichedCategories: {
      [category: string]: {
        vendors: Array<VendorProfile & { aiExplanation: string }>;
      };
    } = {};

    for (const [category, recommendations] of Object.entries(
      aiRecommendations.categories
    )) {
      const vendors = recommendations.vendors.map(rec => {
        const vendorData = candidatesByCategory[category]?.find(
          v => v.id === rec.id
        );

        if (!vendorData) {
          return null;
        }

        return {
          ...vendorData,
          aiExplanation: rec.explanation,
        };
      }).filter(v => v !== null);

      enrichedCategories[category] = {
        vendors: vendors as Array<VendorProfile & { aiExplanation: string }>,
      };
    }

    return new Response(
      JSON.stringify({ categories: enrichedCategories }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Recommendation error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
