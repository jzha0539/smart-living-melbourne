import { Space } from '../types/space';

function getNoiseBand(space: Space) {
  if (space.noiseDb <= 50) return 'very-quiet';
  if (space.noiseDb <= 60) return 'quiet';
  if (space.noiseDb <= 70) return 'moderate';
  return 'busy';
}

function getComfortBand(space: Space) {
  if (space.comfort >= 80) return 'excellent';
  if (space.comfort >= 65) return 'good';
  if (space.comfort >= 50) return 'fair';
  return 'low';
}

export function getPredictedBestTime(
  space: Space,
  activity: 'study' | 'remote work' | 'relax' = 'study'
) {
  const noiseBand = getNoiseBand(space);
  const comfortBand = getComfortBand(space);

  if (activity === 'study') {
    if (noiseBand === 'very-quiet') return '9am–11am';
    if (noiseBand === 'quiet') return '8am–10am';
    if (noiseBand === 'moderate') return '7am–9am';
    return 'before 8am';
  }

  if (activity === 'remote work') {
    if (comfortBand === 'excellent') return '10am–1pm';
    if (comfortBand === 'good') return '9am–12pm';
    if (comfortBand === 'fair') return '8am–10am';
    return 'before 9am';
  }

  if (space.shade >= 70) return 'after 4pm';
  if (space.shade >= 50) return '3pm–5pm';
  return 'before 10am or after 5pm';
}

export function getBestTimeLabel(space: Space) {
  return {
    study: getPredictedBestTime(space, 'study'),
    remoteWork: getPredictedBestTime(space, 'remote work'),
    relax: getPredictedBestTime(space, 'relax'),
  };
}

export function getEstimatedWalkMinutes(space: Space) {
  return Math.max(3, Math.round(space.distance * 12));
}

export function getRouteEfficiency(space: Space) {
  const walk = getEstimatedWalkMinutes(space);

  if (walk <= 8) return 'Very easy access';
  if (walk <= 15) return 'Easy access';
  if (walk <= 22) return 'Moderate access';
  return 'Longer walk';
}