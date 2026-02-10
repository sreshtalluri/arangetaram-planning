import Anthropic from 'npm:@anthropic-ai/sdk@^0.27.0';

/**
 * Creates and returns a configured Anthropic client instance
 * Uses ANTHROPIC_API_KEY from environment variables
 */
export function createClaudeClient(): Anthropic {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  return new Anthropic({
    apiKey,
  });
}

/**
 * Standard CORS headers for Edge Functions
 * Allows all origins and common headers
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
