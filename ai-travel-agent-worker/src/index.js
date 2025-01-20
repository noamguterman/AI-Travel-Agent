import OpenAI from 'openai';

// Define the functions that were in tools.js
const functions = [
	{
		function: getCurrentWeather,
		parameters: {
			type: "object",
			properties: {
				location: {
					type: "string",
					description: "The location from where to get the weather"
				}
			},
			required: ["location"]
		}
	}
]

export default {
  async fetch(request, env, ctx) {
    try {
      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }

      // Only accept POST requests
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      });

      // Parse the request body
      const { query } = await request.json();
      
      if (!query) {
        return new Response("Query is required", { status: 400 });
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

      // Mock function for getCurrentWeather since we can't maintain state in the worker
      const getCurrentWeather = async (location) => {
        // In a real implementation, this would call a weather API
        return {
          temperature: Math.floor(Math.random() * 30) + 10,
          description: "partly cloudy"
        };
      };

      // Create chat completion
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-1106",
        messages: messages,
        functions: functions,
        function_call: "auto"
      });

      // Get the response
      let finalContent = completion.choices[0].message.content;

      // If the model wants to call a function
      if (completion.choices[0].message.function_call) {
        const functionCall = completion.choices[0].message.function_call;
        
        if (functionCall.name === "getCurrentWeather") {
          const args = JSON.parse(functionCall.arguments);
          const weatherData = await getCurrentWeather(args.location);
          
          // Add the function result to messages
          messages.push({
            role: "function",
            name: "getCurrentWeather",
            content: JSON.stringify(weatherData)
          });

          // Get a new completion with the weather data
          const secondCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-1106",
            messages: messages
          });

          finalContent = secondCompletion.choices[0].message.content;
        }
      }

      return new Response(JSON.stringify({ response: finalContent }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });

    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }
};