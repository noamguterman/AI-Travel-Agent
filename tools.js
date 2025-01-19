export async function getCurrentWeather({ location }) {
    const weather = {
        location,
        temperature: "75",
        forecast: "sunny"
    }
    return JSON.stringify(weather)
}

export const functions = [
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