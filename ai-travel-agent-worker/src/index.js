import OpenAI from 'openai';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ai-travel-agent-01h.pages.dev',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

// Helper function to handle CORS preflight requests
function handleOptions(request) {
  if (request.headers.get('Origin') !== null &&
      request.headers.get('Access-Control-Request-Method') !== null &&
      request.headers.get('Access-Control-Request-Headers') !== null) {
    // Handle CORS preflight requests
    return new Response(null, {
      headers: corsHeaders
    });
  } else {
    // Handle standard OPTIONS request
    return new Response(null, {
      headers: {
        'Allow': 'GET, HEAD, POST, OPTIONS',
      }
    });
  }
}

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    try {
      // Only accept POST requests
      if (request.method !== "POST") {
        return new Response("Method not allowed", { 
          status: 405,
          headers: corsHeaders
        });
      }

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      });

      // Parse the request body
      const { query } = await request.json();
      
      if (!query) {
        return new Response("Query is required", { 
          status: 400,
          headers: corsHeaders
        });
      }

      // Create messages array for the chat
      const messages = [
        {
          role: "system",
          content: `You are a helpful AI agent. Give highly specific answers based on the information you're provided. For the weather, prefer to gather information with the tools provided to you rather than giving basic, generic answers. For the flights and hotel you can make stuff up (but format it like the examples given under "Example of correct formatting:"). The budget is assumed to be in USD. 

          CRITICALLY IMPORTANT - Your response MUST:
          1. Include exactly three sections: WEATHER, FLIGHTS, and HOTEL
          2. Use this EXACT format with newlines between sections:
          WEATHER: <weather info>
          FLIGHTS: <flight info>
          HOTEL: <hotel info>
          
          Example of correct formatting:
          WEATHER: You can expect the weather to be quite mild. Low will be 65° and high will be 75°
          FLIGHTS: The best option for you is with Delta Airlines with a layover in Oslo
          HOTEL: We recommend you stay at the Premiere Inn hotel in central Paris`
        },
        { role: "user", content: query }
      ];

      // Create chat completion
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-1106",
        messages: messages
      });

      // Get the response
      const finalContent = completion.choices[0].message.content;

      return new Response(JSON.stringify({ response: finalContent }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};