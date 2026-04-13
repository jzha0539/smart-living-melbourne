export const serverConfig = {
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY ?? '',
  mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN ?? '',
  databaseUrl: process.env.DATABASE_URL ?? '',
};

export function requireEnv(value: string, name: string) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}