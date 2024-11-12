const apiKey = 'b0e1759af6ad5508584372b2f30843ba';
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const currentWeatherDiv = document.querySelector('.current-weather');
const forecastDiv = document.querySelector('.forecast');
const suggestionsDiv = document.getElementById('suggestions');

async function fetchWeather(city) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`);
        const data = await response.json();

        if (data.cod === "200" && data.city.name.toLowerCase() === city.toLowerCase()) {
            displayCurrentWeather(data);
            displayForecast(data);
            setTemperatureUnit(); 
        } else {
            alert('City not found or invalid name');
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
}

searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const city = searchInput.value;
        if (city) {
            fetchWeather(city);
        }
    }
});

searchButton.addEventListener('click', () => {
    const city = searchInput.value;
    if (city) {
        fetchWeather(city);
    }
});


function displayCurrentWeather(data) {
    const currentData = data.list[0];
    const temperature = Math.round(currentData.main.temp) + '°C';
    const humidity = `Humidity: ${currentData.main.humidity}%`;
    const windSpeed = `Wind: ${Math.round(currentData.wind.speed)} m/s`;
    const weatherCondition = currentData.weather[0].description;
    const weatherIcon = `http://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png`;

    currentWeatherDiv.innerHTML = `
        <div class="temperature">${temperature}</div>
        <div class="weather-icon"><img src="${weatherIcon}" alt="${weatherCondition}" /></div>
        <div class="weather-details">
            <p>${weatherCondition.charAt(0).toUpperCase() + weatherCondition.slice(1)}</p>
            <p>${humidity}</p>
            <p>${windSpeed}</p>
        </div>
    `;
}

function displayForecast(data) {
    forecastDiv.innerHTML = ''; 
    let daysDisplayed = 0;
    let lastDate = '';

    for (let i = 0; i < data.list.length && daysDisplayed < 5; i++) {
        const forecastData = data.list[i];
        const forecastDate = new Date(forecastData.dt * 1000).toLocaleDateString('en', { weekday: 'long' });

        if (forecastDate !== lastDate) {
            lastDate = forecastDate;
            daysDisplayed++;

            let dailyTemps = data.list.filter(item => {
                const itemDate = new Date(item.dt * 1000).toLocaleDateString('en', { weekday: 'long' });
                return itemDate === forecastDate;
            });

            let highTemp = Math.max(...dailyTemps.map(item => item.main.temp_max));
            let lowTemp = Math.min(...dailyTemps.map(item => item.main.temp_min));
            const weatherCondition = forecastData.weather[0].description;
            const weatherIcon = `http://openweathermap.org/img/wn/${forecastData.weather[0].icon}@2x.png`;

            const forecastDay = document.createElement('div');
            forecastDay.classList.add('day');
            forecastDay.innerHTML = `
                <p>${forecastDate}</p>
                <span class="icon"><img src="${weatherIcon}" alt="${weatherCondition}" /></span>
                <p class="high-temp">High: ${Math.round(highTemp)}°C</p>
                <p class="low-temp">Low: ${Math.round(lowTemp)}°C</p>
                <p>${weatherCondition.charAt(0).toUpperCase() + weatherCondition.slice(1)}</p>
            `;

            forecastDiv.appendChild(forecastDay);
        }
    }
}


async function fetchCitySuggestions(query) {
    if (!query) {
        suggestionsDiv.innerHTML = ''; 
        return;
    }

    try {
        const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`);
        const cities = await response.json();

        suggestionsDiv.innerHTML = '';
        cities.forEach(city => {
            const suggestion = document.createElement('div');
            suggestion.textContent = `${city.name}, ${city.country}`;
            suggestion.addEventListener('click', () => {
                searchInput.value = city.name;
                fetchWeather(city.name);
                suggestionsDiv.innerHTML = ''; 
            });
            suggestionsDiv.appendChild(suggestion);
        });
    } catch (error) {
        console.error('Error fetching city suggestions:', error);
    }
}

searchInput.addEventListener('input', () => {
    const query = searchInput.value;
    fetchCitySuggestions(query);
});

document.addEventListener('click', (event) => {
    if (!searchInput.contains(event.target) && !suggestionsDiv.contains(event.target)) {
        suggestionsDiv.innerHTML = ''; 
    }
});

const locationButton = document.getElementById('location-button');

locationButton.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
});

function showPosition(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    fetchWeatherByLocation(lat, lon);
}

function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            alert("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            alert("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            alert("An unknown error occurred.");
            break;
    }
}

async function fetchWeatherByLocation(lat, lon) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
        const data = await response.json();

        if (data.cod === "200") {
            displayCurrentWeather(data);
            displayForecast(data);
            setTemperatureUnit();
        } else {
            alert('Unable to retrieve weather data for your location.');
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
}

function setTemperatureUnit() {
    if (!isCelsius) {
      TemperatureDisplay();
    }
}

let isCelsius = true;

const unitToggleButton = document.getElementById('unit-toggle');
unitToggleButton.addEventListener('click', toggleUnits);

function toggleUnits() {
    isCelsius = !isCelsius;
    unitToggleButton.textContent = isCelsius ? '°C / °F' : '°F / °C';

    TemperatureDisplay();
}

function TemperatureDisplay() {
    const currentTempElement = document.querySelector('.temperature');
    let currentTemp = parseFloat(currentTempElement.textContent);
    currentTempElement.textContent = convertTemperature(currentTemp) + (isCelsius ? '°C' : '°F');

    document.querySelectorAll('.day').forEach(day => {
        const highTempElement = day.querySelector('.high-temp');
        const lowTempElement = day.querySelector('.low-temp');
        
        let highTemp = parseFloat(highTempElement.textContent.replace(/[^\d.-]/g, '')); 
        let lowTemp = parseFloat(lowTempElement.textContent.replace(/[^\d.-]/g, ''));   
        
        highTempElement.textContent = `High: ${convertTemperature(highTemp)}°${isCelsius ? 'C' : 'F'}`;
        lowTempElement.textContent = `Low: ${convertTemperature(lowTemp)}°${isCelsius ? 'C' : 'F'}`;
    });
}

function convertTemperature(temp, toFahrenheit = !isCelsius) {
    if (isNaN(temp)) return '';
    return toFahrenheit
        ? Math.round(temp * (9 / 5) + 32) 
        : Math.round((temp - 32) * (5 / 9)); 
}
