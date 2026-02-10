import { createGroqClient, corsHeaders, GROQ_MODEL } from '../_shared/groq-client.ts';
import { CHAT_SYSTEM_PROMPT } from '../_shared/prompts/chat-system.ts';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Event {
  date?: string;
  budget?: number;
  location?: string;
  categories_needed?: string[];
}

interface ChatRequest {
  message: string;
  eventContext?: Event;
  history?: Message[];
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
    const { message, eventContext, history = [] }: ChatRequest = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Groq client
    const groq = createGroqClient();

    // Build messages array with system prompt
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: CHAT_SYSTEM_PROMPT,
      },
    ];

    // Include last 10 messages from history
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Prepend event context to current message if provided
    let userMessage = message;
    if (eventContext) {
      const contextParts: string[] = [];

      if (eventContext.date) {
        contextParts.push(`Event date: ${eventContext.date}`);
      }
      if (eventContext.budget) {
        contextParts.push(`Budget: $${eventContext.budget.toLocaleString()}`);
      }
      if (eventContext.location) {
        contextParts.push(`Location: ${eventContext.location}`);
      }
      if (eventContext.categories_needed && eventContext.categories_needed.length > 0) {
        contextParts.push(`Categories needed: ${eventContext.categories_needed.join(', ')}`);
      }

      if (contextParts.length > 0) {
        userMessage = `[Event context: ${contextParts.join(' | ')}]\n\n${message}`;
      }
    }

    messages.push({
      role: 'user',
      content: userMessage,
    });

    // Create streaming response
    const stream = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 1024,
      messages,
      stream: true,
    });

    // Create ReadableStream for SSE
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
              const data = JSON.stringify({ text });
              controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
            }
          }

          // Send completion marker
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
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
