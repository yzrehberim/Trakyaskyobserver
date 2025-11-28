import { City, ConstellationData, MoonPhase, SkyTheme } from './types';

export const THRACE_CITIES: City[] = [
  { name: 'Çorlu', latitude: 41.1450, longitude: 27.4081 },
  { name: 'Tekirdağ', latitude: 40.3667, longitude: 27.4833 },
  { name: 'Edirne', latitude: 41.1357, longitude: 26.5561 },
  { name: 'Keşan', latitude: 41.3500, longitude: 26.4167 },
  { name: 'Lüleburgaz', latitude: 41.4167, longitude: 27.3667 },
  { name: 'Babaeski', latitude: 41.5000, longitude: 27.0167 }
];

// Data: J2000 Epoch Coordinates for Stick Figures
export const CONSTELLATIONS: ConstellationData[] = [
  { 
    name: 'Ursa Major (Büyük Ayı)', 
    lines: [
      // Big Dipper Bowl
      [{ra: 11.06, dec: 61.75}, {ra: 11.03, dec: 56.38}], // Dubhe -> Merak
      [{ra: 11.03, dec: 56.38}, {ra: 11.89, dec: 53.69}], // Merak -> Phecda
      [{ra: 11.89, dec: 53.69}, {ra: 12.25, dec: 57.03}], // Phecda -> Megrez
      [{ra: 12.25, dec: 57.03}, {ra: 11.06, dec: 61.75}], // Megrez -> Dubhe
      // Handle
      [{ra: 12.25, dec: 57.03}, {ra: 12.90, dec: 55.95}], // Megrez -> Alioth
      [{ra: 12.90, dec: 55.95}, {ra: 13.39, dec: 54.92}], // Alioth -> Mizar
      [{ra: 13.39, dec: 54.92}, {ra: 13.79, dec: 49.31}]  // Mizar -> Alkaid
    ]
  },
  { 
    name: 'Cassiopeia', 
    lines: [
      [{ra: 0.15, dec: 59.15}, {ra: 0.67, dec: 56.53}], // Caph -> Schedar
      [{ra: 0.67, dec: 56.53}, {ra: 0.93, dec: 60.71}], // Schedar -> Gamma Cas
      [{ra: 0.93, dec: 60.71}, {ra: 1.43, dec: 60.23}], // Gamma Cas -> Ruchbah
      [{ra: 1.43, dec: 60.23}, {ra: 1.90, dec: 63.67}]  // Ruchbah -> Segin
    ]
  },
  { 
    name: 'Orion (Avcı)', 
    lines: [
      // Shoulders/Feet
      [{ra: 5.91, dec: 7.40}, {ra: 5.41, dec: 6.34}],   // Betelgeuse -> Bellatrix
      [{ra: 5.91, dec: 7.40}, {ra: 5.67, dec: -1.94}],  // Betelgeuse -> Alnitak
      [{ra: 5.24, dec: -8.20}, {ra: 5.79, dec: -9.66}], // Rigel -> Saiph
      [{ra: 5.24, dec: -8.20}, {ra: 5.53, dec: -0.29}], // Rigel -> Mintaka
      [{ra: 5.41, dec: 6.34}, {ra: 5.53, dec: -0.29}],  // Bellatrix -> Mintaka
      [{ra: 5.79, dec: -9.66}, {ra: 5.67, dec: -1.94}], // Saiph -> Alnitak
      // Belt
      [{ra: 5.67, dec: -1.94}, {ra: 5.60, dec: -1.20}], // Alnitak -> Alnilam
      [{ra: 5.60, dec: -1.20}, {ra: 5.53, dec: -0.29}]  // Alnilam -> Mintaka
    ]
  },
  { 
    name: 'Lyra (Çalgı)', 
    lines: [
        [{ra: 18.61, dec: 38.78}, {ra: 18.83, dec: 32.68}], // Vega -> Sulafat
        [{ra: 18.83, dec: 32.68}, {ra: 18.99, dec: 32.55}], // Sulafat -> Sheliak
        [{ra: 18.99, dec: 32.55}, {ra: 19.28, dec: 37.60}], // Sheliak -> Delta Lyr
        [{ra: 19.28, dec: 37.60}, {ra: 18.61, dec: 38.78}]  // Delta Lyr -> Vega
    ]
  },
  {
    name: 'Cygnus (Kuğu)',
    lines: [
        [{ra: 20.69, dec: 45.28}, {ra: 20.37, dec: 40.26}], // Deneb -> Sadr
        [{ra: 20.37, dec: 40.26}, {ra: 19.51, dec: 27.96}], // Sadr -> Albireo
        [{ra: 20.37, dec: 40.26}, {ra: 19.75, dec: 45.12}], // Sadr -> Delta Cyg
        [{ra: 20.37, dec: 40.26}, {ra: 20.77, dec: 33.97}]  // Sadr -> Epsilon Cyg
    ]
  }
];

export const MOON_PHASES: MoonPhase[] = [
  'Yeni Ay 🌑',
  'Ay Çıkışı 🌒',
  'İlk Çeyrek 🌓',
  'Dolunay Yakını 🌔',
  'Dolunay 🌕',
  'Dolunay Kapanışı 🌖',
  'Son Çeyrek 🌗',
  'Ay Batışı 🌘'
];

export const CLARITY_SCALE: Record<string, string> = {
  '1': 'Çok Kötü (Şehir Işıkları)',
  '2': 'Kötü',
  '3': 'Orta',
  '4': 'İyi',
  '5': 'Mükemmel (Zifiri Karanlık)'
};

export const METEOR_SHOWERS = [
  { name: 'Quadrantids', start: '01-01', end: '01-05', peak: '01-03' },
  { name: 'Lyrids', start: '04-16', end: '04-25', peak: '04-22' },
  { name: 'Eta Aquariids', start: '04-19', end: '05-28', peak: '05-06' },
  { name: 'Delta Aquariids', start: '07-12', end: '08-23', peak: '07-30' },
  { name: 'Perseids', start: '07-17', end: '08-24', peak: '08-12' },
  { name: 'Orionids', start: '10-02', end: '11-07', peak: '10-21' },
  { name: 'Leonids', start: '11-06', end: '11-30', peak: '11-17' },
  { name: 'Geminids', start: '12-04', end: '12-17', peak: '12-14' },
  { name: 'Ursids', start: '12-17', end: '12-26', peak: '12-22' },
];

export const COMMON_DEEP_SKY_OBJECTS = [
  'Andromeda Galaksisi (M31)',
  'Orion Bulutsusu (M42)',
  'Ülker (Pleiades - M45)',
  'Samanyolu Merkezi',
  'Uluslararası Uzay İstasyonu (ISS)',
  'Starlink Uyduları',
  'Kayan Yıldız (Meteor)',
  'Kuzey Tacı (Corona Borealis)'
];

export const SKY_THEMES: Record<string, SkyTheme> = {
  dark: {
    id: 'dark',
    name: 'Karanlık',
    background: '#0B0D17',
    horizonFill: '#101423',
    horizonStroke: '#1F2437',
    gridStroke: '#1F2437',
    cardinalText: '#2DA6B2',
    constellationStroke: 'rgba(255, 255, 255, 0.3)',
    constellationText: 'rgba(255, 255, 255, 0.5)',
    textDefault: '#ffffff',
    highlight: '#2DA6B2',
    crosshair: 'rgba(45, 166, 178, 0.5)'
  },
  light: {
    id: 'light',
    name: 'Aydınlık',
    background: '#F0F4F8',
    horizonFill: '#FFFFFF',
    horizonStroke: '#BCCCDC',
    gridStroke: '#D9E2EC',
    cardinalText: '#102A43',
    constellationStroke: 'rgba(16, 42, 67, 0.2)',
    constellationText: 'rgba(16, 42, 67, 0.5)',
    textDefault: '#102A43',
    highlight: '#D64545',
    crosshair: 'rgba(214, 69, 69, 0.5)'
  },
  sepia: {
    id: 'sepia',
    name: 'Sepya',
    background: '#F4ECD8',
    horizonFill: '#FDFBF7',
    horizonStroke: '#D4C5A9',
    gridStroke: '#E6DCC3',
    cardinalText: '#8D6E63',
    constellationStroke: 'rgba(121, 85, 72, 0.2)',
    constellationText: 'rgba(121, 85, 72, 0.5)',
    textDefault: '#3E2723',
    highlight: '#BF360C',
    crosshair: 'rgba(191, 54, 12, 0.5)'
  }
};