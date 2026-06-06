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
function updateSunDisplay(cityId, sunData) {
  const sunriseBlock = document.getElementById(`block-sunrise-${cityId}`);
  const sunsetBlock = document.getElementById(`block-sunset-${cityId}`);
  
  const timeNow = new Date();
  const sunrise = new Date(sunData.results.sunrise);
  const sunset = new Date(sunData.results.sunset);

  // Je nach Uhrzeit Auf- oder Untergang beim Hovern anzeigen
  let nextBlock;
  if (timeNow < sunrise) nextBlock = sunriseBlock;
  else if (timeNow < sunset) nextBlock = sunsetBlock;
  else nextBlock = sunriseBlock;

  sunriseBlock.classList.toggle('is-next', nextBlock === sunriseBlock);
  sunsetBlock.classList.toggle('is-next', nextBlock === sunsetBlock);
}


// Wetter-Code in Text und Icon umwandeln
function getWeatherDescIcon(code, isDay) {
  if (code === 0) return {text: "Klarer Himmel", icon: "img/svg/Sonne.svg"};
  if (code >= 1 && code <= 3) return {text: "Bewölkt", icon: "img/svg/Wolke.svg"};
  if (code >= 51 && code <= 67) return {text: "Regen", icon: "img/svg/Regen.svg"};
  if (code >= 71 && code <= 77) return {text: "Schnee", icon: "img/svg/Wolke_Schnee.svg"};
  if (code >= 95) return {text:"Gewitter", icon: "img/svg/Blitz_Regen.svg"};
  return {text: "Wechselhaft", icon: isDay? "img/svg/Sonne_Wolke.svg" : "img/svg/Mond_Wolke.svg"};
}

// Wetter-Api laden
async function loadWeatherData(lat, lon) {
  const url = `api_cors_bridge.php?lat=${lat}&lon=${lon}`;

  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error("Fehler beim Laden des Wetters", error);
    return false;
  }
}


// Hintergrundbild dynamisch an Sonnenstand anpassen
function setBackground(sunData) {
  const results = sunData.results;
  const now = new Date().getTime();

  const sunrise = new Date(results.sunrise).getTime();
  const sunset = new Date(results.sunset).getTime();
  const civilBegin = new Date(results.civil_twilight_begin).getTime();
  const civilEnd = new Date(results.civil_twilight_end).getTime();
  const nauticalBegin = new Date(results.nautical_twilight_begin).getTime();
  const nauticalEnd = new Date(results.nautical_twilight_end).getTime();

  // Golden-Hour und Fenster um Sonnenauf- und Untergang wird nicht direkt von API geliefert
  const goldenHour = 45 * 60 * 1000;
  const sunEvent = 15 * 60 *1000;

  let phase;
  if (now < nauticalBegin) phase = 'night';
  else if (now < civilBegin) phase = 'blue-hour';
  else if (now < sunrise - sunEvent) phase = 'sun-event';
  else if (now < sunrise + sunEvent) phase = 'sun-event';
  else if (now < sunrise + goldenHour) phase = 'golden-hour';
  else if (now < sunset - goldenHour) phase = 'day';
  else if (now < sunset - sunEvent) phase = 'golden-hour';
  else if (now < sunset + sunEvent) phase = 'sun-event';
  else if (now < civilEnd) phase = 'sun-event';
  else if (now < nauticalEnd) phase = 'blue-hour';
  else phase = 'night';

  document.body.style.backgroundImage = `url('img/${phase}.jpg')`;
}


// Funktionen ausführen
async function startApp() {
  const candidates = [];

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

      updateSunDisplay(city.id, sunData);

      //Hintergrund dynamisch anpassen
      if (city === cities[0]) {
        setBackground(sunData);
      }
    }

    // Zeitpunkt des nächsten Auf- oder Untergangs bestimmen
    function getNextEventTime(sunData) {
      const now = new Date();
      const sunrise = new Date(sunData.results.sunrise);
      const sunset = new Date(sunData.results.sunset);

      if (now < sunrise) return sunrise;
      if (now < sunset) return sunset;

      //Sonnenaufgang bestimmen, wenn noch der vorherige Tag ist
      const tomorrowSunrise = new Date(sunrise);
      tomorrowSunrise.setDate(tomorrowSunrise.getDate() + 1);
      return tomorrowSunrise;
    }

    // Aus der Vorhersage passende Stunde auswählen
    function getForecastHour(weatherData, targetTime) {
      const times = weatherData.hourly.time;
      const target = targetTime.getTime();

      let bestIndex = 0;
      let bestDiff = Infinity;
      for (let i = 0; i < times.length; i++) {
        const diff = Math.abs(new Date(times[i]).getTime() - target);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestIndex = i;
        }
      }

      return {
        temperature_2m: weatherData.hourly.temperature_2m[bestIndex],
        weather_code: weatherData.hourly.weather_code[bestIndex],
        is_day: weatherData.hourly.is_day[bestIndex],
        cloud_cover: weatherData.hourly.cloud_cover[bestIndex]
      };
    }

    // Wetter-Daten ins html schreiben
    if (weatherData && weatherData.hourly && sunData && sunData.status === "OK") {
      const nextTime = getNextEventTime(sunData);
      const forecast = getForecastHour(weatherData, nextTime);

      const weather = getWeatherDescIcon(forecast.weather_code, forecast.is_day);
      const temp = Math.round(forecast.temperature_2m);

      document.getElementById(`temp-${city.id}`).innerText = `${temp}°C`;
      document.getElementById(`description-${city.id}`).innerText = weather.text;

      const iconEl = document.getElementById(`icon-${city.id}`);
      iconEl.src = weather.icon;
      iconEl.alt = weather.text;

      candidates.push({
        id: city.id,
        name: city.name,
        cloud: forecast.cloud_cover
      });
    }
  }

  //Beste Option bestimmen
  const cloud_maximum = 70;
  const bestOption = document.getElementById('best-option');

  if (candidates.length > 0) {
    const best = candidates.reduce((a,b) => (b.cloud < a.cloud ? b : a));
    
    if (best.cloud <= cloud_maximum) {
      document.getElementById(`card-${best.id}`).classList.add('best');
      bestOption.innerText = `Den schönsten Sonnenuntergang gibt es voraussichtlich in ${best.name} mit ${best.cloud}% Bewölkung.`;
    } else {
      bestOption.innerText = 'Heute gibt es leider nirgends einen schönen Sonnenuntergang zu sehen, da es zu stark bewölkt ist.';
    }
  }
}

//Funktion aufrufen
startApp();



// Cards auf- und zuklappen
const allCards = document.querySelectorAll('.city-card');
allCards.forEach(card => {
  card.addEventListener('click', () => {
    const wasOpen = card.classList.contains('open');

    allCards.forEach(card => card.classList.remove('open'));
    if (!wasOpen) card.classList.add('open');
  });
});


// Klick ausserhalb einer Card schliesst die offene
document.addEventListener('click', (event) => {
  if (!event.target.closest('.city-card')) {
    allCards.forEach(card => card.classList.remove('open'));
  }
});