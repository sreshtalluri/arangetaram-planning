import Groq from 'npm:groq-sdk@^0.5.0';

/**
 * Creates and returns a configured Groq client instance
 * Uses GROQ_API_KEY from environment variables
 */
export function createGroqClient(): Groq {
  const apiKey = Deno.env.get('GROQ_API_KEY');

  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }

  return new Groq({
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

/**
 * Default model for Groq - Llama 3.3 70B is fast and capable
 */
export const GROQ_MODEL = 'llama-3.3-70b-versatile';
