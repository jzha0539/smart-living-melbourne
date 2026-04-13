import { ActivityType, Space } from '../../../types/space';

interface WeatherSnapshot {
  temperature: number;
  humidity: number;
  windSpeed: number;
}

export function calculateComfortScore(weather: WeatherSnapshot): number {
  const tempPenalty = Math.abs(weather.temperature - 22) * 2.5;
  const humidityPenalty = Math.max(0, weather.humidity - 60) * 0.3;
  const windPenalty = Math.max(0, weather.windSpeed - 5) * 2;

  const raw = 100 - tempPenalty - humidityPenalty - windPenalty;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function getWeatherAdvice(weather: WeatherSnapshot): string {
  if (weather.windSpeed >= 8) {
    return 'High wind — not ideal for paper-based study or long outdoor sessions.';
  }

  if (weather.temperature >= 30) {
    return 'Hot conditions — choose shaded areas and stay hydrated.';
  }

  if (weather.temperature <= 10) {
    return 'Cool weather — better for short stays unless the spot is sheltered.';
  }

  if (weather.humidity >= 75) {
    return 'Humid conditions — may feel less comfortable over time.';
  }

  return 'Conditions are generally comfortable for study, work, or short breaks.';
}

export function calculateSerenityScore(space: Space): number {
  const noiseScore = Math.max(0, 100 - space.noiseDb * 1.2);
  const comfortScore = space.comfort;
  const shadeScore = space.shade;
  const distanceScore = Math.max(0, 100 - space.distance * 18);

  const raw =
    noiseScore * 0.4 +
    comfortScore * 0.3 +
    shadeScore * 0.15 +
    distanceScore * 0.15;

  return Math.max(0, Math.min(100, Math.round(raw)));
}

function getActivityScore(space: Space, activity: ActivityType): number {
  const noiseScore = Math.max(0, 100 - space.noiseDb * 1.2);
  const comfortScore = space.comfort;
  const shadeScore = space.shade;
  const distanceScore = Math.max(0, 100 - space.distance * 18);

  if (activity === 'study') {
    return Math.round(
      noiseScore * 0.5 +
        comfortScore * 0.25 +
        distanceScore * 0.15 +
        shadeScore * 0.1
    );
  }

  if (activity === 'remote work') {
    return Math.round(
      comfortScore * 0.4 +
        noiseScore * 0.3 +
        distanceScore * 0.2 +
        shadeScore * 0.1
    );
  }

  return Math.round(
    shadeScore * 0.35 +
      comfortScore * 0.3 +
      noiseScore * 0.2 +
      distanceScore * 0.15
  );
}

export function getActivitySuitabilityExplanation(
  space: Space,
  activity: ActivityType
): string {
  if (activity === 'study') {
    if (space.noiseDb <= 40 && space.comfort >= 75) {
      return 'Quiet and comfortable — well suited for focused study and reading.';
    }
    if (space.noiseDb <= 45) {
      return 'Relatively calm environment — suitable for study with light background activity.';
    }
    return 'Usable for study, but may be less ideal during busier periods.';
  }

  if (activity === 'remote work') {
    if (space.comfort >= 80 && space.noiseDb <= 45) {
      return 'Stable comfort and manageable noise — suitable for laptop work and longer sessions.';
    }
    if (space.comfort >= 70) {
      return 'Comfortable enough for short remote work sessions and light laptop use.';
    }
    return 'Can work for quick tasks, but comfort may drop over longer periods.';
  }

  if (space.shade >= 75 && space.comfort >= 70) {
    return 'Comfortable and shaded — a strong choice for relaxing outdoors.';
  }
  if (space.shade >= 60) {
    return 'Good outdoor coverage and acceptable comfort — suitable for short breaks.';
  }
  return 'Reasonably suitable for relaxation, especially outside peak busy times.';
}

export function enrichSpaceForActivity(
  space: Space,
  activity: ActivityType
): Space & { serenityScore: number; activityExplanation: string } {
  const serenityScore = calculateSerenityScore(space);
  const activityExplanation = getActivitySuitabilityExplanation(space, activity);

  return {
    ...space,
    serenityScore,
    activityExplanation,
  };
}

export function sortSpacesForActivity(
  spaces: Space[],
  activity: ActivityType
): Space[] {
  return [...spaces].sort((a, b) => getActivityScore(b, activity) - getActivityScore(a, activity));
}