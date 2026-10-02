# SkyPulse – Interactive Weather API Consumer

> **Internship / College Task 4**: Interactive API Consumer – Weather Application  
> Built with Semantic HTML5, Modern CSS3 Glassmorphism, and Vanilla JavaScript (ES6+ Fetch API).

---

## 🌤️ Project Overview

**SkyPulse** is a modern, responsive, client-side weather dashboard that consumes live meteorological data from the **OpenWeatherMap REST API**. The application demonstrates real-world asynchronous programming patterns in JavaScript (`async`/`await`, `fetch()`, `try...catch`), comprehensive HTTP error handling, browser `localStorage` persistence, responsive CSS Grid/Flexbox architecture, and dynamic weather-based UI theming.

---

## ✨ Features

- **Dynamic Weather Search**: Look up current weather metrics for any city worldwide by typing its name and clicking "Search Weather" or pressing `Enter`.
- **Geolocation Integration**: One-click "Current Location" button retrieves local weather conditions using the browser's native HTML5 Geolocation API (`navigator.geolocation`).
- **Comprehensive Meteorological Metrics**:
  - City name & country code
  - Current temperature in °C
  - "Feels like" temperature in °C
  - Primary weather condition & description
  - High-resolution weather condition icon
  - Relative humidity percentage (`%`)
  - Wind speed displayed in both `km/h` and `m/s`
  - Atmospheric barometric pressure (`hPa`)
  - Visibility range (`km`)
  - Cloud cover fraction (`%`)
  - Local destination sunrise & sunset times (automatically calculated with destination timezone offsets)
- **Dynamic Weather Theming**: UI background gradient and lighting effects automatically morph to match current sky conditions (Clear, Clouds, Rain, Thunderstorm, Snow, Mist/Fog).
- **Recent Searches History**:
  - Automatically saves the last 5 unique queried cities into browser `localStorage`.
  - Displayed as interactive pill chips for instant re-querying.
  - "Clear History" button to wipe stored searches.
- **Robust Asynchronous Error & State Handling**:
  - Loading spinner with disabled buttons to prevent duplicate calls.
  - User-friendly messages for empty queries, invalid city names (HTTP 404), unauthorized API keys (HTTP 401), rate limits (HTTP 429), and offline network errors.
- **Educational Guide ("How This API Works")**: Built-in interactive documentation explaining REST principles, endpoints, HTTP GET, API keys, JSON payloads, `fetch()`, and `async/await`.
- **Zero Framework Overhead**: 100% vanilla web standards—no React, Node.js, or external heavy libraries required.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **HTML5** | Semantic structure (`<header>`, `<main>`, `<section>`, `<article>`, `<footer>`) & ARIA accessibility |
| **CSS3** | Glassmorphism, CSS Custom Properties (Variables), Flexbox, CSS Grid, animations, and responsive media queries |
| **Vanilla JavaScript (ES6+)** | Asynchronous control flow (`async/await`), DOM manipulation, Event Listeners, and `localStorage` |
| **Fetch API** | Browser-native HTTP GET network requests |
| **OpenWeatherMap API** | Remote REST API providing real-time global weather data |

---

## 🌐 API Details

- **Service**: OpenWeatherMap Current Weather Data
- **Base Endpoint**: `https://api.openweathermap.org/data/2.5/weather`
- **Method**: `GET`
- **Query Parameters**:
  - `q={cityName}`: Target city name (e.g., `London`, `Tokyo`)
  - `lat={lat}&lon={lon}`: Geographic coordinates (used for geolocation)
  - `appid={API_KEY}`: Your developer authentication key
  - `units=metric`: Returns temperature in Celsius (°C) and speed in meters/second (m/s)

---

## 🔑 How to Get an OpenWeatherMap API Key

1. Visit [OpenWeatherMap Sign Up](https://home.openweathermap.org/users/sign_up) and register for a free account.
2. Confirm your email address.
3. Navigate to the [API Keys tab](https://home.openweathermap.org/api_keys).
4. Generate a new key or copy your default key (a 32-character hexadecimal string, e.g., `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`).
5. *Note*: OpenWeatherMap keys typically take **10 to 30 minutes** after creation to become fully active on their global servers.

---

## 📍 Where to Place Your API Key

Open the `config.js` file located in the root of the project:

```javascript
/**
 * config.js
 */
const CONFIG = {
    API_KEY: "YOUR_API_KEY_HERE" // <--- Paste your actual key between quotes here!
};
```

Replace `"YOUR_API_KEY_HERE"` with your actual key:

```javascript
const CONFIG = {
    API_KEY: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
};
```

Save the file. **Do not modify `script.js` directly for the key.** `script.js` automatically imports and reads the key from `config.js`.

---

## 📁 Project Structure

```text
weather-api-app/
│
├── index.html       # Main semantic HTML structure & markup
├── style.css        # Responsive styling, glassmorphism, dynamic weather themes
├── script.js        # Core JavaScript: Fetch API, async/await, DOM, localStorage
├── config.js        # API Key configuration file (git-ignored)
├── .gitignore       # Prevents sensitive API keys and cache files from git commits
└── README.md        # Complete project documentation and guide
```

---

## 🚀 How to Run the Project

### Method 1: Using VS Code Live Server (Recommended)

1. Open **Visual Studio Code**.
2. Go to **File → Open Folder...** and select the `weather-api-app` folder.
3. Open `config.js` and paste your OpenWeatherMap API key.
4. If not already installed, install the **Live Server** extension by *Ritwick Dey* from the VS Code Extensions marketplace (`Ctrl+Shift+X`).
5. Right-click on `index.html` and choose **"Open with Live Server"** (or click **"Go Live"** in the bottom status bar).
6. Live Server will launch your default browser at `http://127.0.0.1:5500/index.html`.

### Method 2: Direct Browser Launch

1. Double-click `index.html` to open it in Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari.
2. *Note*: Some browsers restrict geolocation (`navigator.geolocation`) on the `file:///` protocol. Running through Live Server or an HTTP localhost is recommended for full feature support.

### Method 3: Python Built-in HTTP Server

If you have Python installed, open terminal in `weather-api-app`:
```bash
# Python 3
python -m http.server 8000
```
Open your browser and navigate to `http://localhost:8000`.

---

## 💡 How the Code Works

### 1. Asynchronous JavaScript & Fetch API

The browser's native `fetch()` function sends an asynchronous HTTP request over the network. By pairing it with `async`/`await`, the code reads sequentially while remaining non-blocking:

```javascript
async function fetchWeather(city) {
  showLoading();
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);

    if (!response.ok) {
      handleHttpError(response.status);
      return;
    }

    const data = await response.json();
    displayWeather(data);
    saveRecentCity(data.name);
  } catch (error) {
    showError("Unable to connect to the weather service.");
  } finally {
    hideLoading();
  }
}
```

### 2. HTTP Status Code Validation

Rather than waiting for JSON parsing to fail, we check `response.ok` (HTTP status 200–299). If false, we map specific HTTP error codes to friendly explanations:

- **401 Unauthorized**: Key is missing or not yet activated on OpenWeatherMap.
- **404 Not Found**: City name was misspelled or does not exist.
- **429 Rate Limit**: Free tier limit (60 calls/minute) reached.
- **500/502/503 Server Error**: OpenWeatherMap servers are experiencing issues.

### 3. Destination Local Time Calculation

OpenWeatherMap returns timestamps in UTC seconds (`dt`, `sys.sunrise`, `sys.sunset`) along with the city's timezone offset in seconds (`timezone`). We calculate the destination city's actual time using:

$$\text{City Time} = (\text{Unix Timestamp} + \text{Timezone Offset}) \times 1000$$

This ensures a user searching for Tokyo from New York sees Tokyo's true sunrise and sunset times.

### 4. `localStorage` Persistence

Recent searches are stored in the client's browser using `localStorage.setItem()` and `localStorage.getItem()`. Data is serialized as a JSON string and capped at 5 unique cities with deduplication.

---

## 🔒 Security Note: Client-Side vs. Server-Side Proxy

> [!WARNING]
> In this frontend-only educational project, the API key resides in `config.js` and is sent directly from the browser. Anyone inspecting network traffic via DevTools can view the key.

### Production Best Practice:
In a commercial production environment:
1. **Never expose secret API keys in client-side code.**
2. Build a lightweight **backend server** or **serverless function** (e.g., Node.js / Express, Next.js API Routes, Python FastAPI, or Cloudflare Workers).
3. The client sends a request to your internal server (e.g., `GET /api/weather?city=London`).
4. The server retrieves the private API key securely from server-side environment variables (`process.env.OPENWEATHER_API_KEY`), contacts OpenWeatherMap, sanitizes the response, and returns it to the client.
5. In addition, `config.js` is included in `.gitignore` so your key is never committed to public version control repositories like GitHub.

---

## 🔮 Future Enhancements

- [ ] 5-Day / 3-Hour forecast tab using OpenWeatherMap Forecast API.
- [ ] Celsius (°C) and Fahrenheit (°F) dynamic unit switch.
- [ ] Air Quality Index (AQI) radar card.
- [ ] Interactive Leaflet/OpenStreetMap precipitation radar tile overlay.
- [ ] PWA (Progressive Web App) offline caching support.

---

## 👨‍💻 Author & Attribution

- **Task**: Task 4: Interactive API Consumer – Weather Application
- **Data Provider**: Weather data supplied by [OpenWeatherMap](https://openweathermap.org/)
- **Icons**: OpenWeatherMap Official Weather Icons & Custom Feather-style SVG icons
