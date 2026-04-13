import { WeatherSnapshot } from '../external/weather';

export function calculateComfortScore(weather: WeatherSnapshot): number {
  const tempPenalty = Math.abs(weather.temperature - 22) * 2.5;
  const humidityPenalty = Math.max(0, weather.humidity - 60) * 0.3;
  const windPenalty = Math.max(0, weather.windSpeed - 5) * 2;

  const raw = 100 - tempPenalty - humidityPenalty - windPenalty;
  return Math.max(0, Math.min(100, Math.round(raw)));
}