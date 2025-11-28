export interface City {
  name: string;
  latitude: number;
  longitude: number;
}

export interface CelestialBody {
  name: string;
  azimuth: number; // Degrees (0 is North)
  altitude: number; // Degrees (90 is Zenith, 0 is Horizon)
  distance: number; // AU or km
  magnitude: number; // Brightness
  type: 'planet' | 'star' | 'moon' | 'sun';
  color: string;
}

export interface WeatherData {
  temperature: number;
  cloudCover: number; // Percentage
  windSpeed: number;
  conditionCode: number; // WMO code
  conditionText: string;
  isDay: boolean;
}

export interface MoonData {
  phaseName: string;
  illumination: number; // 0 to 1
  age: number; // Days since new moon
  emoji: string;
}

export interface Observation {
  id: number;
  date: string;
  time: string;
  location: City;
  weather: string;
  objects: string;
  skyClarity: string; // '1' to '5'
  notes: string;
  timestamp: string;
  aiAnalysis?: string;
}

// Definition data (Static RA/Dec)
export interface StarCoordinate {
  ra: number;
  dec: number;
}

export interface ConstellationData {
  name: string;
  lines: [StarCoordinate, StarCoordinate][]; // Pairs of stars forming lines
}

// Render data (Calculated Az/Alt)
export interface ConstellationLineState {
  from: { azimuth: number; altitude: number };
  to: { azimuth: number; altitude: number };
}

export interface ConstellationState {
  name: string;
  lines: ConstellationLineState[];
}

export type MoonPhase = string;

export interface SkyTheme {
  id: string;
  name: string;
  background: string;
  horizonFill: string;
  horizonStroke: string;
  gridStroke: string;
  cardinalText: string;
  constellationStroke: string;
  constellationText: string;
  textDefault: string;
  highlight: string;
  crosshair: string;
}