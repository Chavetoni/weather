
//key from openweathermap.org
const apiKey = "89af8fdb8fee4a09fd866ff08bfa4d20";
// url from openweathermap.org
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=imperial&q=";

const weatherAPIKey = "f2dde0fe150d42b2beb192615231708";
const weatherAPIForecastUrl = `http://api.weatherapi.com/v1/forecast.json?key=${weatherAPIKey}`;


const searchBox = document.querySelector(".search input");
const searchButton = document.querySelector(".search button");
const weatherIcon = document.querySelector(".weather-icon");
const fahrenheitButton = document.getElementById('Fahrenheit');
const celsiusButton = document.getElementById('Celsius');


let temperatureInCelsius, temperatureInFahrenheit;
let precipitation


const autocompleteUrl = 'https://us1.locationiq.com/v1/autocomplete.php?key=pk.4b39d2cd153fd58068a3773ebe8f28ee&q=';
const oneCallApiUrl = `https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude=minutely,daily,alerts&appid=${apiKey}`;
const forecastApiUrl = `https://api.openweathermap.org/data/2.5/forecast?units=imperial&q=`;
// const oneCallApiUrl = `https://api.openweathermap.org/data/2.5/onecall?lat={lat}&lon={lon}&exclude=current,minutely,daily,alerts&appid=${apiKey}`;
// const hourlyForecastApiUrl = `https://pro.openweathermap.org/data/2.5/forecast/hourly?lat={lat}&lon={lon}&appid=${apiKey}`;

let debounceTimeout;
searchBox.addEventListener('input', function() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async function () {
        const autocompleteResults = document.getElementById('autocomplete-results');
        if ( searchBox.value.length >= 3) {
            const suggestions = await getSuggestions(searchBox.value);
            showSuggestions(suggestions);
        } else {
            autocompleteResults.innerHTML = ' ';
            autocompleteResults.classList.add('hidden');

        }
    }, 300);
});


searchButton.addEventListener("click", () => {
    checkWeather(searchBox.value);
});

searchBox.addEventListener('keydown', function(e) {
    if (e.key === "Enter") { // checks whether the pressed key is "Enter"
        e.preventDefault(); // prevents the default action
        checkWeather(searchBox.value);
    }
});

fahrenheitButton.addEventListener('click', () => {
    switchTemperature('F');
    highlightActiveUnit('F');
});

celsiusButton.addEventListener('click', () => {
    switchTemperature('C');
    highlightActiveUnit('C');
});


function switchTemperature(unit) {
    const displayTemperature = unit === 'F' ? temperatureInFahrenheit : temperatureInCelsius;
    document.querySelector(".temp").innerHTML = Math.round(displayTemperature) + "°" + unit;
}

function highlightActiveUnit(unit) {
    fahrenheitButton.classList.remove('active');
    celsiusButton.classList.remove('active');

    if (unit === 'F') {
        fahrenheitButton.classList.add('active');
    } else {
        celsiusButton.classList.add('active');
    }
}


document.getElementById('autocomplete-results').classList.add('hidden');

async function checkWeather(city){

        


        const response = await fetch(apiUrl + city + `&appid=${apiKey}`);
        const forecastResponse = await fetch(forecastApiUrl + city + `&appid=${apiKey}`);
        

        const autocompleteResults = document.getElementById('autocomplete-results');
        autocompleteResults.innerHTML = '';
        autocompleteResults.classList.add('hidden');

        if(response.status == 404){
            document.querySelector(".error").style.display = "block";
            document.querySelector(".weather").style.display = "none";
        }else {
            var data = await response.json();
            

            //check time of day

            const currentUnixTime = Math.round(new Date().getTime() / 1000);
            const timezoneOffset = data.timezone; // Get the timezone offset in seconds
            const locationTime = new Date((currentUnixTime + timezoneOffset) * 1000); // Convert to milliseconds

            const sunrise = new Date(data.sys.sunrise * 1000);
            const sunset = new Date(data.sys.sunset * 1000);

            const isDayTime = locationTime > sunrise && locationTime < sunset;
            changeBackground(isDayTime);
            ////////////////////////


            //retrieve weather data
            const currentRain = data.rain && data.rain["1h"] ? data.rain["1h"] : 0;
            const currentSnow = data.snow && data.snow["1h"] ? data.snow["1h"] : 0;
            const totalCurrentPrecipitation = currentRain + currentSnow;
            const weatherDescription = data.weather[0].description;
            document.getElementById('weather-description').textContent = weatherDescription.charAt(0).toUpperCase() + weatherDescription.slice(1);  
            document.querySelector(".city").innerHTML = data.name;
            document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
            document.querySelector(".wind").innerHTML = Math.round(data.wind.speed) + " mph";
            document.querySelector(".precipitation").innerHTML = totalCurrentPrecipitation + " mm/h";

           
            // // Display weather icon
            const weatherIconId= data.weather[0].icon;
            const iconUrl = `https://openweathermap.org/img/wn/${weatherIconId}@4x.png`;
            weatherIcon.src = iconUrl;
            ////////////////////////
            
            // Add animate class
            const weather = document.querySelector(".weather");
            weather.style.display = "block";
        // Ensure the animate class is removed and re-added
        if (weather.classList.contains('animate')) {
                weather.classList.remove('animate');
                // Wait a bit before re-adding the class to retrigger the animation
                setTimeout(() => weather.classList.add('animate'), 50);
            } else {
                weather.classList.add('animate');
            }
            ////////////////////////

            temperatureInFahrenheit = data.main.temp;  
            temperatureInCelsius = convertTemperature(temperatureInFahrenheit, 'F'); 
            
            let currentUnit = 'F';
            if (temperatureToggle) {
                currentUnit = temperatureToggle.getAttribute('data-unit');
            }
            // Update the temperature right away
            
            const displayTemperature = currentUnit === 'F' ? temperatureInFahrenheit : temperatureInCelsius;
        

            // Update the temperature on the page
            document.querySelector(".temp").innerHTML = Math.round(displayTemperature) + "°" + currentUnit;


            document.querySelector(".error").style.display = "none";


            //////////forcast/////////////////////

            ///day of the week
            function getDayName(dateStr) {
                const dateObj = new Date(dateStr);
                const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                return days[dateObj.getDay()];
            }
            

            if (forecastResponse.ok) {
                const forecastData = await forecastResponse.json();
            
                const forecastContainer = document.querySelector('.card-list');
                forecastContainer.innerHTML = '';  // Clear any existing cards
            
                for (let i = 0; i < forecastData.list.length; i += 8) {
                    const dailyData = forecastData.list.slice(i, i + 8); // Extracting data for each day
            
                    const card = document.createElement('article');
                    card.className = 'card';
            
                    const header = document.createElement('header');
                    header.className = 'card-header';
            
                    const date = new Date(dailyData[0].dt * 1000).toLocaleDateString();
                    const tempMax = Math.max(...dailyData.map(interval => interval.main.temp_max));
                    const tempMin = Math.min(...dailyData.map(interval => interval.main.temp_min));
                    const mainWeather = dailyData[0].weather[0].main;
                    const icon = dailyData[0].weather[0].icon;
                    const weatherDescription = dailyData[0].weather[0].description;
            
                    header.innerHTML = `
                        <p class="day-name">${getDayName(date)}</p>
                        <img src="https://openweathermap.org/img/w/${icon}.png" alt="${mainWeather}" />
                        <h4 class ="day-weather_condition">${weatherDescription.charAt(0).toUpperCase() + weatherDescription.slice(1)}</h4> 
                        <h3 class="day-temp">H: ${Math.round(tempMax)}° | L: ${Math.round(tempMin)}°</h3>
                    `;
            
                    card.appendChild(header);
                    forecastContainer.appendChild(card);
                }
            } else {
                // Handle forecast fetching error
                console.error('Failed to fetch forecast data.');
            }    
             ////////////////////////


             ////////hourly forecast/////////////////////

              fetchHourlyForecast(city);  // <-- Add this line here

             async function fetchHourlyForecast(city) {
                const finalUrl = `${weatherAPIForecastUrl}&q=${city}&days=1`;
                console.log("Fetching hourly forecast for:", city);
                try {
                    const response = await fetch(finalUrl);
                    console.log("Response received:", response);
                    const data = await response.json();
                    console.log("Parsed data:", data);
                    if (data && data.forecast && data.forecast.forecastday && data.forecast.forecastday[0]) {
                        const hourlyData = data.forecast.forecastday[0].hour;
                        displayHourlyData(hourlyData);
                    } else {
                        console.error("Unexpected data format from WeatherAPI");
                    }
                } catch (error) {
                    console.error("Error fetching hourly forecast:", error);
                }
            }
            
            function displayHourlyData(hourlyData) {
                const tbody = document.getElementById("hourlyWeatherData");
                
                // Clear any previous data
                while (tbody.firstChild) {
                    tbody.removeChild(tbody.firstChild);
                }
                
                hourlyData.forEach(hour => {
                    const time = new Date(hour.time).getHours();  // Extract the hour from the time field
                    const iconUrl = hour.condition.icon;
                    const weatherCondition = hour.condition.text;
                    const temperatureC = Math.round(hour.temp_c);  // Temperature is already in Celsius
                    const temperatureF = Math.round((hour.temp_c * 9/5 + 32)); //Convert Celsius to Fahrenheit to Fahrenheit   
                    // Create a new row and its cells
                    const row = document.createElement('tr');
            
                    const timeCell = document.createElement('td');
                    timeCell.className = "p-2";
                    timeCell.textContent = `${time}:00`;
            
                    const iconCell = document.createElement('td');
                    iconCell.className = "p-2 text-center";
                    const iconImage = document.createElement('img');
                    iconImage.src = iconUrl;
                    iconImage.alt = `${weatherCondition} icon`;
                    iconImage.width = 50;
                    iconCell.appendChild(iconImage);
            
                    const conditionCell = document.createElement('td');
                    conditionCell.className = "p-2";
                    conditionCell.textContent = weatherCondition;
            
                    const tempCell = document.createElement('td');
                    tempCell.className = "p-2";
                    tempCell.textContent = `${temperatureF}°F / ${temperatureC}°C`;
            
                    // Append cells to the row
                    row.appendChild(timeCell);
                    row.appendChild(iconCell);
                    row.appendChild(conditionCell);
                    row.appendChild(tempCell);
            
                    // Append the row to the tbody
                    tbody.appendChild(row);
                });
            }

        
        }
            
            
            
}






async function getSuggestions(input) {
    const response = await fetch(autocompleteUrl + input);
    const data = await response.json();
    return data;
}

function showSuggestions(results) {
    var autocompleteResults = document.getElementById('autocomplete-results');

    if (results.length > 0) {
        // remove the 'hidden' class
        autocompleteResults.classList.remove('hidden');

        // Take the first 4 results, or fewer if there are not enough.
        var topResults = results.slice(0, 4);

        var suggestionHTML = topResults.map(result => `<li class="suggestion">${result.display_name}</li>`).join('');
        autocompleteResults.innerHTML = suggestionHTML;

        var suggestions = document.querySelectorAll(".suggestion");
        suggestions.forEach(suggestion => {
            suggestion.addEventListener("click", function(event) {
                // Set the search bar value to the clicked suggestion
                searchBox.value = event.target.textContent;

                // Optionally, immediately search the weather
                checkWeather(searchBox.value);

                // Clear suggestions
                autocompleteResults.innerHTML = '';
                autocompleteResults.classList.add('hidden');
            });
        });
        

    } else {
        // if there are no results, add the 'hidden' class
        autocompleteResults.classList.add('hidden');
    }
}

function changeBackground(isDayTime) {
    const card = document.querySelector('.card');


    if (isDayTime) {
        // It's daytime, so let's use a light background
        card.style.background = "linear-gradient(180deg, #87CEFA , #005AA7)";
    } else {
        // It's nighttime, so let's use a dark background
        card.style.background = "linear-gradient(180deg, #1c3f63, #3c6385";
    }
}

//add event listener to toggle button
function convertTemperature (degree, unit) {
    if( unit == "F") {
        return (degree - 32) * 5/9;
    }
    else {
        return (degree * 9/5) + 32;
    }
}

//add event listener to toggle button
const temperatureToggle = document.getElementById('temperature-toggle');
temperatureToggle.addEventListener('click', () => {
    const currentUnit = temperatureToggle.getAttribute('data-unit');
    const newUnit = currentUnit === 'F' ? 'C' : 'F';
    const newText = `Switch to ${newUnit === 'F' ? 'Celsius' : 'Fahrenheit'}`;
    temperatureToggle.setAttribute('data-unit', newUnit);
    temperatureToggle.innerText = newText;

    // Now just update the displayed temperature based on the new unit
    const displayTemperature = newUnit === 'F' ? temperatureInFahrenheit : temperatureInCelsius;
    document.querySelector(".temp").innerHTML = Math.round(displayTemperature) + "°" + newUnit;
});








highlightActiveUnit('F'); // Place this line somewhere in your initial script setup
switchTemperature('F');