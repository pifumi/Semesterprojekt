// Ortschaften definieren

const cities = [
  {
    id: 'genf',
    name: 'Genf',
    lat: 46.2017559,
    lon: 6.1466014
  },

  {
    id: 'basel',
    name: 'Basel',
    lat: 47.5581077,
    lon: 7.5878261
  },

  {
    id: 'lugano',
    name: 'Lugano',
    lat: 46.0038007,
    lon: 8.9512275
  }
];


// Uhrzeit aus Datums-Strang korrekt anzeigen
function formatTime(dateString) {
  const dateObj = new Date(dateString);
  return dateObj.toLocaleTimeString('de-CH', {hour: '2-digit', minute: '2-digit'});
}


// Sonnen-API laden
async function loadSunData(lat, lon) {
  const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&tzid=Europe/Zurich&formatted=0`;
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error("Fehler beim Laden der Sonnen-Daten", error);
    return false;
  }
}

// Uhrzeit Auf- und Untergang eintragen
function updateSunDisplay(cityId) {
  const sunriseBlock = document.getElementById(`block-sunrise-${cityId}`);
  const sunsetBlock = document.getElementById(`block-sunset-${cityId}`);
  const currentHour = new Date().getHours();

  // Je nach Uhrzeit Auf- oder Untergang beim Hovern anzeigen
  if (currentHour >= 9 && currentHour < 22) {
    sunsetBlock.classList.remove('hidden');
    sunriseBlock.classList.add('hidden');
  } else {
    sunriseBlock.classList.remove('hidden');
    sunsetBlock.classList.add('hidden');
  }
}


// Wetter-Code in Text umwandeln
function getWeatherDescription(code) {
  if (code === 0) return "Klarer Himmel";
  if (code >= 1 && code <= 3) return "Bewölkt";
  if (code >= 51 && code <= 67) return "Regen";
  if (code >= 71 && code <= 77) return "Schnee";
  if (code >= 95) return "Gewitter";
  return "Wechselhaft";
}

// Wetter-Api laden
async function loadWeatherData(lat, lon) {
  const url = '../api_cors_bridge.php';

  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error("Fehler beim Laden des Wetters", error);
    return false;
  }
}


// Funktionen ausführen
async function startApp() {
  for (const city of cities) {

    // Sonnen-Daten laden
    const sunData = await loadSunData(city.lat, city.lon);

    // Wetter-Daten laden
    const weatherData = await loadWeatherData(city.lat, city.lon);

    console.log(weatherData);
    
    // Sonnen-Daten ins html übertragen
    if (sunData && sunData.status === "OK") {
      const sunriseTime = formatTime(sunData.results.sunrise);
      const sunsetTime = formatTime(sunData.results.sunset);

      document.getElementById(`sunrise-${city.id}`).innerText = `${sunriseTime} Uhr`
      document.getElementById(`sunset-${city.id}`).innerText = `${sunsetTime} Uhr`;

      updateSunDisplay(city.id);
    }

    // Wetter-Daten ins html schreiben
    if (weatherData && weatherData.current) {
      const desc = getWeatherDescription(weatherData.current.weather_code);
      const temp = Math.round(weatherData.current.temperature_2m);

      document.getElementById(`temp-${city.id}`).innerText = `${temp}°C`;
      document.getElementById(`description-${city.id}`).innerText = desc;
    }
  }
}

startApp();

    const weatherData = await loadWeatherData(city.lat, city.lon);

    console.log(weatherData);