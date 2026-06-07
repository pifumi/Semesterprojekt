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
  const sunriseEvent = document.getElementById(`event-sunrise-${cityId}`);
  const sunsetEvent = document.getElementById(`event-sunset-${cityId}`);
  
  const timeNow = new Date();
  const sunrise = new Date(sunData.results.sunrise);
  const sunset = new Date(sunData.results.sunset);

  // Je nach Uhrzeit Auf- oder Untergang beim Hovern anzeigen
  let nextEvent;
  if (timeNow < sunrise) nextEvent = sunriseEvent;
  else if (timeNow < sunset) nextEvent = sunsetEvent;
  else nextEvent = sunriseEvent;

  sunriseEvent.classList.toggle('is-next', nextEvent === sunriseEvent);
  sunsetEvent.classList.toggle('is-next', nextEvent === sunsetEvent);
}





// Wetter-Code in Text und Icon umwandeln
function getWeatherDescIcon(code, cloudCover) {
  
  if (code === 45 || code === 48)
    {return { text: "Nebel", icon: "img/svg/Wolke.svg" };
  }

  if (code === 51 || code === 53 || code === 61 || code === 80) {
    return { text: "Leichter Regen", icon: "img/svg/Niesel.svg" };
}

  if (code === 55 || code === 63 || code === 65 || code === 81 || code === 82 || code === 56 || code === 57 || code === 66 || code === 67) {
    return { text: "Regen", icon: "img/svg/Regen.svg" };
  }

  if (code === 71 || code === 85) {
    return { text: "Leichter Schnee", icon: "img/svg/Wolke_wenigSchnee.svg"};
  }

  if (code === 73 || code === 75 || code === 77 || code === 86) {
    return {text: "Schnee", icon: "img/svg/Wolke_Schnee.svg"};
  }

  if (code >= 95) {
    return {text:"Gewitter", icon: "img/svg/Blitz_Regen.svg" };
  }


  // bei trockenem Wetter Icon anhand des Bewölkungsgrades auswählen
  if (cloudCover < 20) {
    return {text: "Klarer Himmel", icon: "img/svg/Sonne.svg"};
  }

  if (cloudCover < 70) {
    return {text: "Teils bewölkt", icon: "img/svg/Sonne_Wolke.svg"};
  }

 return {text: "Stark bewölkt", icon: "img/svg/Wolke.svg"};
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


// Ermitteln, welches Event als nächstes folgt
function getNextEventType(sunData) {
  const now = new Date();
  const sunrise = new Date(sunData.results.sunrise);
  const sunset = new Date(sunData.results.sunset);
  if (now < sunrise) return 'sunrise';
  if (now < sunset) return 'sunset';
  return 'sunrise';
}


// Hilfsfunktion Wetter-Events befüllen
function fillEvent(eventType, cityId, forecast) {
  const weather = getWeatherDescIcon(forecast.weather_code, forecast.cloud_cover);
  const temp = Math.round(forecast.temperature_2m);

  document.getElementById(`temp-${eventType}-${cityId}`).innerText = `${temp}°C`;
  document.getElementById(`description-${eventType}-${cityId}`).innerText = weather.text;

  const iconEl = document.getElementById(`icon-${eventType}-${cityId}`);
  iconEl.src = weather.icon;
  iconEl.alt = weather.text;
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
  const goldenHour = 90 * 60 * 1000;
  const sunEvent = 30 * 60 *1000;

  let phase;
  if (now < nauticalBegin) phase = 'night';
  else if (now < civilBegin) phase = 'blue-hour';
  else if (now < sunrise - sunEvent) phase = 'blue-hour';
  else if (now < sunrise + sunEvent) phase = 'sun-event';
  else if (now < sunrise + goldenHour) phase = 'golden-hour';
  else if (now < sunset - goldenHour) phase = 'day';
  else if (now < sunset - sunEvent) phase = 'golden-hour';
  else if (now < sunset + sunEvent) phase = 'sun-event';
  else if (now < civilEnd) phase = 'blue-hour';
  else if (now < nauticalEnd) phase = 'blue-hour';
  else phase = 'night';

  document.body.style.backgroundImage = `url('img/${phase}.jpg')`;
  document.body.dataset.phase = phase;
}


// Funktionen ausführen
async function startApp() {
  const candidates = [];

  for (const city of cities) {

    // Sonnen-Daten laden
    const sunData = await loadSunData(city.lat, city.lon);

    // Wetter-Daten laden
    const weatherData = await loadWeatherData(city.lat, city.lon);

    
    // Sonnen-Daten ins html übertragen
    if (sunData && sunData.status === "OK") {
      const sunriseTime = formatTime(sunData.results.sunrise);
      const sunsetTime = formatTime(sunData.results.sunset);

      document.getElementById(`time-sunrise-${city.id}`).innerText = `${sunriseTime} Uhr`
      document.getElementById(`time-sunset-${city.id}`).innerText = `${sunsetTime} Uhr`;

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
        cloud_cover: weatherData.hourly.cloud_cover[bestIndex]
      };
    }

    
    
    // Wetter-Daten ins html schreiben
    if (weatherData && weatherData.hourly && sunData && sunData.status === "OK") {
      const now = new Date();

      // Wenn heutige Zeit vorbei, auf morgige beziehen
      const sunriseTime = new Date(sunData.results.sunrise);
      if (now > sunriseTime) sunriseTime.setDate(sunriseTime.getDate() + 1);

      const sunsetTime = new Date(sunData.results.sunset);
      if (now > sunsetTime) sunsetTime.setDate(sunsetTime.getDate() + 1);

      fillEvent('sunrise', city.id, getForecastHour(weatherData, sunriseTime));
      fillEvent('sunset', city.id, getForecastHour(weatherData, sunsetTime));

      // Beste Option orientiert sich an nächstem Ereignis
      const nextForecast = getForecastHour(weatherData, getNextEventTime(sunData));
      const nextType = getNextEventType(sunData);

      candidates.push({
        id: city.id,
        name: city.name,
        cloud: nextForecast.cloud_cover,
        event: nextType
      });

      // Daten an Karte hinterlegen
      const cardElement = document.getElementById(`card-${city.id}`);
      cardElement.dataset.name = city.name;
      cardElement.dataset.cloud = Math.round(nextForecast.cloud_cover);
      cardElement.dataset.event = nextType;
    }
  }

  // Beste Option bestimmen
  const cloud_maximum = 70;
  const bestOption = document.getElementById('info-text');

  if (candidates.length > 0) {
    const best = candidates.reduce((a,b) => (b.cloud < a.cloud ? b : a));
    const eventWord = best.event === 'sunset' ? 'Sonnenuntergang' : 'Sonnenaufgang';
    
    let defaultText;
    if (best.cloud <= cloud_maximum) {
      document.getElementById(`card-${best.id}`).classList.add('best');
      defaultText = `Den schönsten ${eventWord} gibt es voraussichtlich in ${best.name} mit ${best.cloud}% Bewölkung.`;
    } else {
      defaultText = `Leider gibt es voraussichtlich nirgends einen schönen ${eventWord} zu sehen.`;
    }

    bestOption.innerText = defaultText;
    bestOption.dataset.defaultText = defaultText;
  }
}

// Funktion aufrufen
startApp();



// Cards auf- und zuklappen
const allCards = document.querySelectorAll('.city-card');
const bestOption = document.getElementById('info-text');

allCards.forEach(card => {
  card.addEventListener('click', () => {
    const wasOpen = card.classList.contains('open');
    allCards.forEach(card => card.classList.remove('open'));

    if (!wasOpen) {
      card.classList.add('open');
      const eventWord = card.dataset.event === 'sunset' ? 'Sonnenuntergang' : 'Sonnenaufgang';
      bestOption.innerText = `In ${card.dataset.name} liegt die Bewölkung zum nächsten ${eventWord} bei voraussichtlich ${card.dataset.cloud}%.`;
    } else {
      bestOption.innerText = bestOption.dataset.defaultText;
    }

    // nach dem Aufklappen nach unten scrollen
     setTimeout(() => {
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 300);
  });
});


// Klick ausserhalb einer Card schliesst die offene
document.addEventListener('click', (event) => {
  if (!event.target.closest('.city-card')) {
    allCards.forEach(c => c.classList.remove('open'));
    bestOption.innerText = bestOption.dataset.defaultText;
  }
});