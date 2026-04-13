import { requireEnv, serverConfig } from '../config';

export interface WeatherSnapshot {
  temperature: number;
  humidity: number;
  windSpeed: number;
  description: string;
}

interface OpenWeatherResponse {
  main: {
    temp: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
  weather: Array<{
    description: string;
  }>;
}

export async function fetchWeatherByCoords(
  lat: number,
  lon: number
): Promise<WeatherSnapshot> {
  const apiKey = requireEnv(serverConfig.openWeatherApiKey, 'OPENWEATHER_API_KEY');

  const url = new URL('https://api.openweathermap.org/data/2.5/weather');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('appid', apiKey);
  url.searchParams.set('units', 'metric');

  const response = await fetch(url.toString(), {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`OpenWeather request failed: ${response.status}`);
  }

  const data = (await response.json()) as OpenWeatherResponse;

  return {
    temperature: data.main.temp,
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    description: data.weather?.[0]?.description ?? 'Unknown',
  };
}