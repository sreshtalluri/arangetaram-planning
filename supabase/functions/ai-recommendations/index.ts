import { createClient } from 'jsr:@supabase/supabase-js@2';
import { createGroqClient, corsHeaders, GROQ_MODEL } from '../_shared/groq-client.ts';
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

    // Geocode event location once for all categories
    let locationContext = eventData.location || 'Not specified';
    let geocodedLat: number | null = null;
    let geocodedLng: number | null = null;

    if (eventData.location) {
      try {
        const mapboxToken = Deno.env.get('MAPBOX_TOKEN');
        if (mapboxToken) {
          const geocodeRes = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(eventData.location)}.json?access_token=${mapboxToken}&types=place,postcode&country=US&limit=1`
          );
          const geocodeData = await geocodeRes.json();
          if (geocodeData.features?.length > 0) {
            const [lng, lat] = geocodeData.features[0].center;
            geocodedLat = lat;
            geocodedLng = lng;
            locationContext = geocodeData.features[0].place_name || eventData.location;
          }
        }
      } catch (geoErr) {
        console.error('Geocoding error:', geoErr);
      }
    }

    for (const category of eventData.categories_needed) {
      // Build query with filters
      let query = supabase
        .from('vendor_profiles')
        .select('id, business_name, description, category, service_areas, price_min, price_max, profile_photo_url')
        .eq('is_published', true)
        .eq('category', category);

      // Filter by location using PostGIS distance if geocoded
      if (geocodedLat !== null && geocodedLng !== null) {
        const { data: nearbyVendors } = await supabase
          .rpc('search_vendors_by_location', {
            search_lat: geocodedLat,
            search_lng: geocodedLng,
            radius_miles: 50,
            category_filter: category,
          });

        if (nearbyVendors && nearbyVendors.length > 0) {
          const nearbyIds = nearbyVendors.map((v: any) => v.id);
          query = query.in('id', nearbyIds);
        }
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
    const groq = createGroqClient();

    // Build context for AI
    const eventContext = {
      date: eventData.event_date,
      location: locationContext,
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
        location: v.service_areas?.[0] || 'Unknown',
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

    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content: RECOMMENDATION_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      response_format: { type: 'json_object' },
    });

    // Extract text from response
    const textContent = response.choices[0]?.message?.content;
    if (!textContent) {
      throw new Error('No content in AI response');
    }

    // Parse AI response JSON
    let aiRecommendations: AIResponse;
    try {
      aiRecommendations = JSON.parse(textContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', textContent);
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
