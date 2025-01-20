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

let weatherAdvice
let flightsAdvice
let hotelAdvice

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
    try {
        const response = await fetch('https://ai-travel-agent-worker.noamguterman.workers.dev/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const finalContent = data.response;
        
        const sections = finalContent.split(/WEATHER:|FLIGHTS:|HOTEL:/).filter(Boolean);
        const finalArr = sections.map(section => section.trim());
        weatherAdvice = finalArr[0];
        flightsAdvice = finalArr[1];
        hotelAdvice = finalArr[2];
    } catch (error) {
        console.error('Error:', error);
        weatherAdvice = "Sorry, there was an error getting weather information.";
        flightsAdvice = "Sorry, there was an error getting flight information.";
        hotelAdvice = "Sorry, there was an error getting hotel information.";
        
        // Show an error alert to the user
        const alert = document.getElementById('alert');
        alert.textContent = "There was an error processing your request. Please try again.";
        alert.classList.remove('hidden');
    }
}