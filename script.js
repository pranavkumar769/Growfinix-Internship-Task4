/**
 * ====================================================================
 * SkyPulse Weather Application - Core JavaScript
 * Modern Responsive Weather Dashboard
 * ====================================================================
 * 
 * Tech Stack: Vanilla JavaScript (ES6+), Fetch API, DOM Manipulation
 * REST APIs: Direct Public Weather REST API (Open-Meteo) with OpenWeatherMap support
 * ====================================================================
 */

// --------------------------------------------------------------------
// 1. Constants & Configuration
// --------------------------------------------------------------------
const OWM_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const GEOCODING_API_URL = "https://geocoding-api.open-meteo.com/v1/search";
const DIRECT_WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
const RECENT_SEARCHES_KEY = "skypulse_recent_cities";
const MAX_RECENT_SEARCHES = 5;

// State tracking
let isLoading = false;

// --------------------------------------------------------------------
// 2. DOM Elements Selection
// --------------------------------------------------------------------
// Search and inputs
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const clearInputBtn = document.getElementById("clearInputBtn");
const recentSearchesContainer = document.getElementById("recentSearchesContainer");
const recentSearchesList = document.getElementById("recentSearchesList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

// Feedback states
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const errorTitle = document.getElementById("errorTitle");
const errorMessage = document.getElementById("errorMessage");
const dismissErrorBtn = document.getElementById("dismissErrorBtn");

// Content displays
const welcomeState = document.getElementById("welcomeState");
const weatherDisplay = document.getElementById("weatherDisplay");

// Weather metric fields
const cityNameEl = document.getElementById("cityName");
const countryCodeEl = document.getElementById("countryCode");
const localDateTimeEl = document.getElementById("localDateTime");
const weatherConditionTag = document.getElementById("weatherConditionTag");
const currentTempEl = document.getElementById("currentTemp");
const feelsLikeSummaryEl = document.getElementById("feelsLikeSummary");
const weatherIconEl = document.getElementById("weatherIcon");
const weatherDescEl = document.getElementById("weatherDescription");

const metricFeelsLike = document.getElementById("metricFeelsLike");
const metricHumidity = document.getElementById("metricHumidity");
const metricWindSpeed = document.getElementById("metricWindSpeed");
const metricWindMs = document.getElementById("metricWindMs");
const metricPressure = document.getElementById("metricPressure");
const metricVisibility = document.getElementById("metricVisibility");
const metricClouds = document.getElementById("metricClouds");
const metricSunrise = document.getElementById("metricSunrise");
const metricSunset = document.getElementById("metricSunset");

// --------------------------------------------------------------------
// 3. API Key Helper
// --------------------------------------------------------------------
/**
 * Checks if a custom OpenWeatherMap key is configured.
 * @returns {string|null}
 */
function getCustomApiKey() {
  if (typeof CONFIG !== "undefined" && CONFIG.API_KEY) {
    const key = CONFIG.API_KEY.trim();
    if (key !== "" && key !== "YOUR_API_KEY_HERE") {
      return key;
    }
  }
  return null;
}

// --------------------------------------------------------------------
// 4. Loading & Error State Handlers
// --------------------------------------------------------------------
/**
 * Enables loading indicator, disables buttons, and prevents duplicate requests.
 */
function showLoading() {
  isLoading = true;
  hideError();
  loadingState.classList.remove("hidden");
  searchBtn.disabled = true;
  locationBtn.disabled = true;
}

/**
 * Hides loading indicator and re-enables buttons.
 */
function hideLoading() {
  isLoading = false;
  loadingState.classList.add("hidden");
  searchBtn.disabled = false;
  locationBtn.disabled = false;
}

/**
 * Displays user-friendly error messages in the UI.
 * @param {string} message - Explanatory error message
 * @param {string} [title="Oops! Something went wrong"] - Error header title
 */
function showError(message, title = "Oops! Something went wrong") {
  errorTitle.textContent = title;
  errorMessage.textContent = message;
  errorState.classList.remove("hidden");
  errorState.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Dismisses the error notification banner.
 */
function hideError() {
  errorState.classList.add("hidden");
}

// --------------------------------------------------------------------
// 5. Asynchronous Weather Fetching Logic (Direct Access - No Key Required)
// --------------------------------------------------------------------
/**
 * Fetches current weather data for a city.
 * Provides direct access without requiring an API key.
 * If an OpenWeatherMap API key is provided, attempts that first; otherwise uses direct REST API.
 * @param {string} city - Name of the city to query
 */
async function fetchWeather(city) {
  const trimmedCity = city.trim();

  // 1. Validate input
  if (!trimmedCity) {
    showError("Please enter a city name.", "Empty Search");
    cityInput.focus();
    return;
  }

  showLoading();

  try {
    const customKey = getCustomApiKey();

    // If user provided an active OpenWeatherMap key, try it first
    if (customKey) {
      try {
        const owmUrl = `${OWM_BASE_URL}?q=${encodeURIComponent(trimmedCity)}&appid=${customKey}&units=metric`;
        const owmRes = await fetch(owmUrl);
        if (owmRes.ok) {
          const owmData = await owmRes.json();
          displayWeather(owmData);
          saveRecentCity(owmData.name);
          return;
        }
      } catch (owmErr) {
        console.warn("OpenWeatherMap fetch error, falling back to direct REST API:", owmErr);
      }
    }

    // Direct Access: Fetch live weather directly with zero API key required!
    await fetchWeatherDirect(trimmedCity);

  } catch (error) {
    console.error("Fetch Error:", error);
    showError("Unable to connect to the weather service.", "Network Error");
  } finally {
    hideLoading();
  }
}

/**
 * Fetches live weather directly using open public REST APIs without requiring any key.
 * @param {string} cityName
 */
async function fetchWeatherDirect(cityName) {
  // Step 1: Geocoding lookup for city coordinates
  const geoUrl = `${GEOCODING_API_URL}?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
  const geoRes = await fetch(geoUrl);
  
  if (!geoRes.ok) {
    throw new Error("Geocoding service unavailable");
  }

  const geoData = await geoRes.json();

  if (!geoData.results || geoData.results.length === 0) {
    showError("City not found. Please check the city name.", "Location Not Found");
    return;
  }

  const location = geoData.results[0];
  const { latitude, longitude, name, country_code } = location;

  // Step 2: Fetch full live meteorological data
  const weatherUrl = `${DIRECT_WEATHER_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,surface_pressure,wind_speed_10m,cloud_cover&daily=sunrise,sunset&timezone=auto`;
  const weatherRes = await fetch(weatherUrl);

  if (!weatherRes.ok) {
    throw new Error("Weather service unavailable");
  }

  const weatherData = await weatherRes.json();

  // Step 3: Format into standard application payload
  const formattedData = formatDirectWeatherResponse(name, country_code, weatherData);
  displayWeather(formattedData);
  saveRecentCity(name);
}

/**
 * Fetches weather by geographic coordinates (Used by Current Location button).
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 */
async function fetchWeatherByCoords(lat, lon) {
  showLoading();

  try {
    const customKey = getCustomApiKey();

    if (customKey) {
      try {
        const owmUrl = `${OWM_BASE_URL}?lat=${lat}&lon=${lon}&appid=${customKey}&units=metric`;
        const owmRes = await fetch(owmUrl);
        if (owmRes.ok) {
          const owmData = await owmRes.json();
          displayWeather(owmData);
          saveRecentCity(owmData.name);
          return;
        }
      } catch (e) {
        console.warn("OpenWeatherMap coordinate error, using direct API:", e);
      }
    }

    // Direct access coordinates fetch
    const weatherUrl = `${DIRECT_WEATHER_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,surface_pressure,wind_speed_10m,cloud_cover&daily=sunrise,sunset&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);

    if (!weatherRes.ok) {
      throw new Error("Weather service unavailable");
    }

    const weatherData = await weatherRes.json();
    const formattedData = formatDirectWeatherResponse("Current Location", "GPS", weatherData);
    displayWeather(formattedData);
    saveRecentCity("Current Location");

  } catch (error) {
    console.error("Coords Fetch Error:", error);
    showError("Unable to connect to the weather service.", "Network Error");
  } finally {
    hideLoading();
  }
}

// --------------------------------------------------------------------
// 6. Direct Weather Response Mapper
// --------------------------------------------------------------------
/**
 * Maps WMO weather codes to conditions, descriptions, and icon codes.
 * @param {number} code - WMO weather code
 * @returns {Object}
 */
function mapWmoWeather(code) {
  if (code === 0) return { main: "Clear", description: "Clear sky", icon: "01d" };
  if (code === 1) return { main: "Clear", description: "Mainly clear sky", icon: "01d" };
  if (code === 2) return { main: "Clouds", description: "Partly cloudy", icon: "02d" };
  if (code === 3) return { main: "Clouds", description: "Overcast", icon: "04d" };
  if (code === 45 || code === 48) return { main: "Mist", description: "Foggy conditions", icon: "50d" };
  if (code >= 51 && code <= 55) return { main: "Rain", description: "Light drizzle", icon: "09d" };
  if (code >= 61 && code <= 65) return { main: "Rain", description: "Rain showers", icon: "10d" };
  if (code >= 71 && code <= 77) return { main: "Snow", description: "Snowfall", icon: "13d" };
  if (code >= 80 && code <= 82) return { main: "Rain", description: "Heavy rain showers", icon: "09d" };
  if (code >= 85 && code <= 86) return { main: "Snow", description: "Snow showers", icon: "13d" };
  if (code >= 95) return { main: "Thunderstorm", description: "Thunderstorm with rain", icon: "11d" };
  return { main: "Clouds", description: "Scattered clouds", icon: "03d" };
}

/**
 * Transforms direct API response into standard payload format.
 */
function formatDirectWeatherResponse(cityName, countryCode, apiData) {
  const current = apiData.current;
  const daily = apiData.daily || {};
  const cond = mapWmoWeather(current.weather_code);

  // Parse sunrise & sunset times
  const sunriseStr = daily.sunrise && daily.sunrise[0] ? formatIsoTimeToAmPm(daily.sunrise[0]) : "6:00 AM";
  const sunsetStr = daily.sunset && daily.sunset[0] ? formatIsoTimeToAmPm(daily.sunset[0]) : "6:30 PM";

  // Wind speed: direct API returns km/h
  const windKmh = current.wind_speed_10m || 0;
  const windMs = (windKmh / 3.6).toFixed(1);

  return {
    name: cityName,
    sys: {
      country: countryCode || "Global",
      sunriseFormatted: sunriseStr,
      sunsetFormatted: sunsetStr
    },
    main: {
      temp: current.temperature_2m,
      feels_like: current.apparent_temperature,
      pressure: Math.round(current.surface_pressure || 1013),
      humidity: current.relative_humidity_2m || 50
    },
    wind: {
      speed: parseFloat(windMs),
      speedKmh: windKmh.toFixed(1)
    },
    visibility: 10000,
    clouds: {
      all: current.cloud_cover !== undefined ? current.cloud_cover : 20
    },
    weather: [
      {
        main: cond.main,
        description: cond.description,
        icon: cond.icon
      }
    ],
    timezoneOffsetSeconds: apiData.utc_offset_seconds || 0
  };
}

/**
 * Converts ISO 8601 string "YYYY-MM-DDTHH:MM" to 12-hour "hh:mm AM/PM"
 */
function formatIsoTimeToAmPm(isoStr) {
  if (!isoStr) return "--:--";
  const parts = isoStr.split("T");
  if (parts.length < 2) return isoStr;
  const timeParts = parts[1].split(":");
  let h = parseInt(timeParts[0], 10);
  const m = timeParts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

// --------------------------------------------------------------------
// 7. UI Rendering & Weather Metrics
// --------------------------------------------------------------------
/**
 * Renders the weather data object onto the dashboard.
 * @param {Object} data - The weather response object
 */
function displayWeather(data) {
  if (!data || !data.main || !data.weather || data.weather.length === 0) {
    showError("Received incomplete weather data from the service.", "Data Error");
    return;
  }

  // 1. Hide welcome banner, show weather display card
  welcomeState.classList.add("hidden");
  weatherDisplay.classList.remove("hidden");

  // 2. City & Country
  cityNameEl.textContent = data.name;
  countryCodeEl.textContent = data.sys && data.sys.country ? data.sys.country : "N/A";

  // 3. Local formatted Date & Time
  const timezoneOffset = data.timezone || data.timezoneOffsetSeconds || 0;
  localDateTimeEl.textContent = formatLocalDateTime(timezoneOffset);

  // 4. Primary Weather Condition & Description
  const weatherInfo = data.weather[0];
  weatherConditionTag.textContent = weatherInfo.main;
  weatherDescEl.textContent = capitalizeWords(weatherInfo.description);

  // 5. Weather Icon
  const iconCode = weatherInfo.icon;
  weatherIconEl.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
  weatherIconEl.alt = weatherInfo.description;

  // 6. Current Temperature & Feels Like
  const tempCurrent = Math.round(data.main.temp);
  const feelsLike = Math.round(data.main.feels_like);
  currentTempEl.textContent = tempCurrent;
  feelsLikeSummaryEl.textContent = `${feelsLike}°C`;

  // 7. Grid Metrics
  metricFeelsLike.textContent = feelsLike;
  metricHumidity.textContent = data.main.humidity;
  
  // Wind Speed
  if (data.wind.speedKmh !== undefined) {
    metricWindSpeed.textContent = data.wind.speedKmh;
    metricWindMs.textContent = `${data.wind.speed} m/s`;
  } else {
    const windMs = data.wind.speed !== undefined ? data.wind.speed : 0;
    const windKmh = (windMs * 3.6).toFixed(1);
    metricWindSpeed.textContent = windKmh;
    metricWindMs.textContent = `${windMs.toFixed(1)} m/s`;
  }

  // Atmospheric Pressure (hPa)
  metricPressure.textContent = data.main.pressure;

  // Visibility: Convert meters to kilometers
  if (data.visibility !== undefined) {
    const visibilityKm = (data.visibility / 1000).toFixed(1);
    metricVisibility.textContent = visibilityKm;
  } else {
    metricVisibility.textContent = "10.0";
  }

  // Cloudiness Percentage (%)
  metricClouds.textContent = data.clouds && data.clouds.all !== undefined ? data.clouds.all : 0;

  // Sunrise and Sunset
  if (data.sys && data.sys.sunriseFormatted && data.sys.sunsetFormatted) {
    metricSunrise.textContent = data.sys.sunriseFormatted;
    metricSunset.textContent = data.sys.sunsetFormatted;
  } else if (data.sys && data.sys.sunrise && data.sys.sunset) {
    metricSunrise.textContent = formatUnixTime(data.sys.sunrise, timezoneOffset);
    metricSunset.textContent = formatUnixTime(data.sys.sunset, timezoneOffset);
  } else {
    metricSunrise.textContent = "6:15 AM";
    metricSunset.textContent = "6:45 PM";
  }

  // 8. Dynamic Weather UI Theme
  updateWeatherUITheme(weatherInfo.main);

  // 9. Smoothly scroll into view
  weatherDisplay.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Updates the document body theme class based on the weather condition.
 * @param {string} condition - Main weather category (Clear, Clouds, Rain, etc.)
 */
function updateWeatherUITheme(condition) {
  document.body.classList.remove(
    "theme-default",
    "theme-clear",
    "theme-clouds",
    "theme-rain",
    "theme-thunderstorm",
    "theme-snow",
    "theme-mist"
  );

  const normalized = condition.toLowerCase();

  if (normalized.includes("clear")) {
    document.body.classList.add("theme-clear");
  } else if (normalized.includes("cloud")) {
    document.body.classList.add("theme-clouds");
  } else if (normalized.includes("rain") || normalized.includes("drizzle")) {
    document.body.classList.add("theme-rain");
  } else if (normalized.includes("thunderstorm")) {
    document.body.classList.add("theme-thunderstorm");
  } else if (normalized.includes("snow")) {
    document.body.classList.add("theme-snow");
  } else if (
    normalized.includes("mist") ||
    normalized.includes("fog") ||
    normalized.includes("haze") ||
    normalized.includes("smoke") ||
    normalized.includes("dust")
  ) {
    document.body.classList.add("theme-mist");
  } else {
    document.body.classList.add("theme-default");
  }
}

// --------------------------------------------------------------------
// 8. Time & Date Formatting Helpers
// --------------------------------------------------------------------
/**
 * Capitalizes each word in a string (e.g., "scattered clouds" -> "Scattered Clouds")
 * @param {string} str
 * @returns {string}
 */
function capitalizeWords(str) {
  if (!str) return "";
  return str
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Formats a Unix timestamp into readable local 12-hour time (e.g. "6:45 AM")
 * @param {number} unixTimestamp - Epoch timestamp in seconds
 * @param {number} timezoneOffsetSeconds - Shift in seconds from UTC
 * @returns {string} Formatted time string
 */
function formatUnixTime(unixTimestamp, timezoneOffsetSeconds) {
  const date = new Date((unixTimestamp + timezoneOffsetSeconds) * 1000);
  
  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  
  return `${hours}:${formattedMinutes} ${ampm}`;
}

/**
 * Generates formatted date & time string for destination city.
 * @param {number} timezoneOffsetSeconds - Shift in seconds from UTC
 * @returns {string} Formatted local destination string
 */
function formatLocalDateTime(timezoneOffsetSeconds) {
  const now = new Date();
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60000;
  const cityTime = new Date(utcNow + timezoneOffsetSeconds * 1000);

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const dayName = days[cityTime.getDay()];
  const monthName = months[cityTime.getMonth()];
  const dateNum = cityTime.getDate();

  let hours = cityTime.getHours();
  const minutes = cityTime.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

  return `${dayName}, ${monthName} ${dateNum} • Local Time: ${hours}:${formattedMinutes} ${ampm}`;
}

// --------------------------------------------------------------------
// 9. Recent Searches Management (localStorage)
// --------------------------------------------------------------------
/**
 * Retrieves the recent searches array from browser localStorage.
 * @returns {string[]} Array of recently searched city names
 */
function getRecentCities() {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("Unable to read localStorage:", e);
    return [];
  }
}

/**
 * Saves a city name to recent searches in localStorage.
 * Prevents duplicates and maintains maximum of 5 items.
 * @param {string} city - The city name to store
 */
function saveRecentCity(city) {
  if (!city) return;
  const formatted = capitalizeWords(city.trim());
  let cities = getRecentCities();

  cities = cities.filter(item => item.toLowerCase() !== formatted.toLowerCase());
  cities.unshift(formatted);

  if (cities.length > MAX_RECENT_SEARCHES) {
    cities = cities.slice(0, MAX_RECENT_SEARCHES);
  }

  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(cities));
    renderRecentCities();
  } catch (e) {
    console.warn("Unable to write to localStorage:", e);
  }
}

/**
 * Clears recent searches from localStorage and updates the DOM.
 */
function clearRecentCities() {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    renderRecentCities();
  } catch (e) {
    console.warn("Unable to clear localStorage:", e);
  }
}

/**
 * Renders the recent searches chips into the UI.
 */
function renderRecentCities() {
  const cities = getRecentCities();
  recentSearchesList.innerHTML = "";

  if (cities.length === 0) {
    recentSearchesContainer.classList.add("hidden");
    return;
  }

  recentSearchesContainer.classList.remove("hidden");

  cities.forEach(city => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "recent-chip";
    chip.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      <span>${city}</span>
    `;

    chip.addEventListener("click", () => {
      cityInput.value = city;
      clearInputBtn.classList.remove("hidden");
      fetchWeather(city);
    });

    recentSearchesList.appendChild(chip);
  });
}

// --------------------------------------------------------------------
// 10. Browser Geolocation Handler
// --------------------------------------------------------------------
/**
 * Uses HTML5 navigator.geolocation to detect user coordinates and load weather.
 */
function handleCurrentLocation() {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by your browser.", "Geolocation Unsupported");
    return;
  }

  showLoading();

  navigator.geolocation.getCurrentPosition(
    position => {
      const { latitude, longitude } = position.coords;
      fetchWeatherByCoords(latitude, longitude);
    },
    error => {
      hideLoading();
      console.warn("Geolocation Error:", error);
      let message = "Unable to retrieve your current location.";
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = "Location permission denied. Please search for your city manually or allow location access in your browser settings.";
          break;
        case error.POSITION_UNAVAILABLE:
          message = "Location information is currently unavailable. Please enter a city manually.";
          break;
        case error.TIMEOUT:
          message = "The request to get your location timed out. Please try searching for your city.";
          break;
      }
      showError(message, "Location Access");
    },
    {
      timeout: 10000,
      enableHighAccuracy: true
    }
  );
}

// --------------------------------------------------------------------
// 11. Event Listeners & Initialization
// --------------------------------------------------------------------
function initEventListeners() {
  // Form submission (Search button or Enter key)
  searchForm.addEventListener("submit", e => {
    e.preventDefault();
    if (isLoading) return;
    const city = cityInput.value.trim();
    fetchWeather(city);
  });

  // Current Location button
  locationBtn.addEventListener("click", () => {
    if (isLoading) return;
    handleCurrentLocation();
  });

  // Input typing: toggle clear input button
  cityInput.addEventListener("input", () => {
    if (cityInput.value.trim().length > 0) {
      clearInputBtn.classList.remove("hidden");
    } else {
      clearInputBtn.classList.add("hidden");
    }
  });

  // Clear search input button
  clearInputBtn.addEventListener("click", () => {
    cityInput.value = "";
    clearInputBtn.classList.add("hidden");
    cityInput.focus();
  });

  // Dismiss error notification
  dismissErrorBtn.addEventListener("click", hideError);

  // Clear search history
  clearHistoryBtn.addEventListener("click", clearRecentCities);

  // Popular destination quick buttons in welcome card
  document.querySelectorAll(".popular-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const city = btn.getAttribute("data-city");
      if (city) {
        cityInput.value = city;
        clearInputBtn.classList.remove("hidden");
        fetchWeather(city);
      }
    });
  });
}

/**
 * Application Bootstrap
 */
function initApp() {
  renderRecentCities();
  initEventListeners();
  console.log("SkyPulse Weather Application Initialized with Direct REST API Access.");
}

// Start app once DOM is fully parsed
document.addEventListener("DOMContentLoaded", initApp);
