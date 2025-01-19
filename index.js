import OpenAI from 'openai'
import { getCurrentWeather, functions } from './tools'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
})

let weatherAdvice
let flightsAdvice
let hotelAdvice
const welcomeScreen = document.getElementById('welcome-screen')
const inputScreen = document.getElementById('input-screen')
const loadingScreen = document.getElementById('loading-screen')
const outputScreen = document.getElementById('output-screen')
const travellers = document.getElementById('travellers')
const flyingFrom = document.getElementById('flying-from')
const flyingTo = document.getElementById('flying-to')
const fromDate = document.getElementById('from-date')
const toDate = document.getElementById('to-date')
const budget = document.getElementById('budget')

document.getElementById('begin').addEventListener('click', initInputScreen)
document.getElementById('add').addEventListener('click', handleAddTraveller)
document.getElementById('subtract').addEventListener('click', handleSubtractTraveller)
document.getElementById('submit').addEventListener('click', initOutputScreen)
document.getElementById('book-flight-btn').addEventListener('click', handleBookFlight)
document.getElementById('book-hotel-btn').addEventListener('click', handleBookHotel)

function initInputScreen() {
    welcomeScreen.classList.add('hidden')
    inputScreen.classList.remove('hidden')
}

async function initOutputScreen() {
    const dateFromEl = document.getElementById('date-from')
    const dateToEl = document.getElementById('date-to')
    const locationsEl = document.getElementById('location-from-to')
    const weatherEl = document.getElementById('weather-text')
    const flightEl = document.getElementById('flight-text')
    const hotelEl = document.getElementById('hotel-text')
    
    if (verifyFilledForm()) {
        inputScreen.classList.add('hidden')
        loadingScreen.classList.remove('hidden')
        
        await agent(`Number of travellers: ${travellers.value}, Departure date: ${fromDate.value}, Return date: ${toDate.value}, Departure from: ${flyingFrom.value} Destination: ${flyingTo.value}, Budget: ${budget.value}`)
        
        loadingScreen.classList.add('hidden')
        
        dateFromEl.textContent = `→ ${fromDate.value}`
        dateToEl.textContent = `${toDate.value} ←`
        locationsEl.textContent = `${flyingFrom.value} → ${flyingTo.value}`
        weatherEl.textContent = weatherAdvice
        flightEl.textContent = flightsAdvice
        hotelEl.textContent = hotelAdvice
        
        outputScreen.classList.remove('hidden')
    } else {
        const alert = document.getElementById('alert')
        alert.classList.remove('hidden')
    }
}

function handleAddTraveller() {
    travellers.value < 8 && travellers.value++
}

function handleSubtractTraveller() {
    travellers.value > 1 && travellers.value--
}

function verifyFilledForm() {
    return flyingFrom.value && flyingTo.value && fromDate.value && toDate.value && budget.value
}

function handleBookFlight() {
    const btnText = document.getElementById('book-flight-btn')
    btnText.textContent = 'Flight booked!'
}

function handleBookHotel() {
    const btnText = document.getElementById('book-hotel-btn')
    btnText.textContent = 'Hotel booked!'
}

async function agent(query) {
    const messages = [
        { role: "system", content: `You are a helpful AI agent. Give highly specific answers based on the information you're provided. For the weather, prefer to gather information with the tools provided to you rather than giving basic, generic answers. For the flights and hotel you can make stuff up (but format it like the examples given under "Example of correct formatting:"). The budget is assumed to be in USD. 

        CRITICALLY IMPORTANT - Your response MUST:
        1. Include exactly three sections: WEATHER, FLIGHTS, and HOTEL
        2. Use this EXACT format with newlines between sections:
        WEATHER: <weather info>
        FLIGHTS: <flight info>
        HOTEL: <hotel info>
        
        Example of correct formatting:
        WEATHER: You can expect the weather to be quite mild. Low will be 65° and high will be 75°
        FLIGHTS: The best option for you is with Delta Airlines with a layover in Oslo
        HOTEL: We recommend you stay at the Premiere Inn hotel in central Paris` },
        
        { role: "user", content: query }
    ]

    const runner = openai.beta.chat.completions.runFunctions({
        model: "gpt-3.5-turbo-1106",
        messages,
        functions
    }).on("message", (message) => console.log(message))
    
    const finalContent = await runner.finalContent()
    console.log(finalContent)
    
    const sections = finalContent.split(/WEATHER:|FLIGHTS:|HOTEL:/).filter(Boolean)
    const finalArr = sections.map(section => section.trim())
    weatherAdvice = finalArr[0]
    flightsAdvice = finalArr[1]
    hotelAdvice = finalArr[2]
}