import type { ProxyResult } from './types';

export const countries = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
];

const cityMap: Record<string, string[]> = {
  US: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami', 'Seattle', 'Dallas', 'Denver'],
  GB: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow'],
  DE: ['Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Cologne'],
  FR: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'],
  CA: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
  AU: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
  JP: ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Sapporo'],
  IN: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'],
  BR: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza'],
  RU: ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan'],
  KR: ['Seoul', 'Busan', 'Incheon', 'Daegu'],
  SG: ['Singapore'],
  NL: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht'],
  IT: ['Rome', 'Milan', 'Naples', 'Turin', 'Florence'],
  ES: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao'],
  MX: ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla'],
  ID: ['Jakarta', 'Surabaya', 'Bandung', 'Medan'],
  TR: ['Istanbul', 'Ankara', 'Izmir', 'Bursa'],
  PH: ['Manila', 'Cebu', 'Davao', 'Quezon City'],
  PL: ['Warsaw', 'Krakow', 'Wroclaw', 'Gdansk'],
};

const ispMap: Record<string, string[]> = {
  US: ['Comcast', 'AT&T', 'Verizon', 'Spectrum', 'Cox Communications'],
  GB: ['BT', 'Virgin Media', 'Sky Broadband', 'TalkTalk'],
  DE: ['Deutsche Telekom', 'Vodafone DE', '1&1', 'O2'],
  FR: ['Orange', 'Free', 'SFR', 'Bouygues Telecom'],
  CA: ['Bell Canada', 'Rogers', 'Telus', 'Shaw'],
  AU: ['Telstra', 'Optus', 'TPG', 'iiNet'],
  JP: ['NTT', 'KDDI', 'SoftBank', 'So-net'],
  IN: ['Jio', 'Airtel', 'BSNL', 'Vi'],
  BR: ['Vivo', 'Claro', 'TIM', 'Oi'],
  RU: ['Rostelecom', 'MTS', 'Beeline', 'MegaFon'],
  KR: ['KT', 'SK Broadband', 'LG U+'],
  SG: ['Singtel', 'StarHub', 'M1'],
  NL: ['KPN', 'Ziggo', 'T-Mobile NL'],
  IT: ['TIM', 'Vodafone IT', 'WindTre', 'Fastweb'],
  ES: ['Movistar', 'Vodafone ES', 'Orange ES', 'MásMóvil'],
  MX: ['Telmex', 'Megacable', 'Izzi'],
  ID: ['Telkomsel', 'Indosat', 'XL Axiata'],
  TR: ['Türk Telekom', 'Turkcell', 'Vodafone TR'],
  PH: ['PLDT', 'Globe Telecom', 'Converge'],
  PL: ['Orange PL', 'Play', 'T-Mobile PL', 'Plus'],
};

const timezoneMap: Record<string, string> = {
  US: 'America/New_York',
  GB: 'Europe/London',
  DE: 'Europe/Berlin',
  FR: 'Europe/Paris',
  CA: 'America/Toronto',
  AU: 'Australia/Sydney',
  JP: 'Asia/Tokyo',
  IN: 'Asia/Kolkata',
  BR: 'America/Sao_Paulo',
  RU: 'Europe/Moscow',
  KR: 'Asia/Seoul',
  SG: 'Asia/Singapore',
  NL: 'Europe/Amsterdam',
  IT: 'Europe/Rome',
  ES: 'Europe/Madrid',
  MX: 'America/Mexico_City',
  ID: 'Asia/Jakarta',
  TR: 'Europe/Istanbul',
  PH: 'Asia/Manila',
  PL: 'Europe/Warsaw',
};

const langMap: Record<string, string> = {
  US: 'en-US', GB: 'en-GB', DE: 'de-DE', FR: 'fr-FR', CA: 'en-CA',
  AU: 'en-AU', JP: 'ja-JP', IN: 'hi-IN', BR: 'pt-BR', RU: 'ru-RU',
  KR: 'ko-KR', SG: 'en-SG', NL: 'nl-NL', IT: 'it-IT', ES: 'es-ES',
  MX: 'es-MX', ID: 'id-ID', TR: 'tr-TR', PH: 'fil-PH', PL: 'pl-PL',
};

const coordMap: Record<string, [number, number]> = {
  US: [40.7128, -74.0060], GB: [51.5074, -0.1278], DE: [52.52, 13.405],
  FR: [48.8566, 2.3522], CA: [43.6532, -79.3832], AU: [-33.8688, 151.2093],
  JP: [35.6762, 139.6503], IN: [19.076, 72.8777], BR: [-23.5505, -46.6333],
  RU: [55.7558, 37.6173], KR: [37.5665, 126.978], SG: [1.3521, 103.8198],
  NL: [52.3676, 4.9041], IT: [41.9028, 12.4964], ES: [40.4168, -3.7038],
  MX: [19.4326, -99.1332], ID: [-6.2088, 106.8456], TR: [41.0082, 28.9784],
  PH: [14.5995, 120.9842], PL: [52.2297, 21.0122],
};

function randomIP(): string {
  return `${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function randomPort(): string {
  const ports = ['8080', '3128', '1080', '8888', '9090', '80', '443'];
  return ports[Math.floor(Math.random() * ports.length)];
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateProxies(countryCode: string, count: number = 5): ProxyResult[] {
  const cities = cityMap[countryCode] || ['Unknown City'];
  const isps = ispMap[countryCode] || ['Unknown ISP'];
  const country = countries.find(c => c.code === countryCode)?.name || countryCode;

  return Array.from({ length: count }, () => ({
    ip: randomIP(),
    port: randomPort(),
    country,
    city: randomPick(cities),
    isp: randomPick(isps),
    speed: `${Math.floor(Math.random() * 90) + 10} Mbps`,
    type: 'Residential',
    latency: `${Math.floor(Math.random() * 150) + 20}ms`,
  }));
}

export function getTimezone(countryCode: string): string {
  return timezoneMap[countryCode] || 'UTC';
}

export function getLanguage(countryCode: string): string {
  return langMap[countryCode] || 'en-US';
}

export function getCoords(countryCode: string): [number, number] {
  const base = coordMap[countryCode] || [0, 0];
  return [
    base[0] + (Math.random() - 0.5) * 0.5,
    base[1] + (Math.random() - 0.5) * 0.5,
  ];
}

export const deviceBrands: Record<string, { models: string[]; gpuRenderer: string }> = {
  'Samsung': {
    models: ['Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S23 Ultra', 'Galaxy S23', 'Galaxy A54', 'Galaxy A34', 'Galaxy Z Fold5', 'Galaxy Z Flip5', 'Galaxy S22 Ultra', 'Galaxy Note 20 Ultra'],
    gpuRenderer: 'Mali-G720',
  },
  'Google': {
    models: ['Pixel 8 Pro', 'Pixel 8', 'Pixel 7 Pro', 'Pixel 7', 'Pixel 7a', 'Pixel 6 Pro', 'Pixel 6', 'Pixel 6a'],
    gpuRenderer: 'Mali-G710',
  },
  'OnePlus': {
    models: ['12', '11', '10 Pro', '10T', 'Nord 3', 'Nord CE 3', '9 Pro', '9'],
    gpuRenderer: 'Adreno 750',
  },
  'Xiaomi': {
    models: ['14 Pro', '14', '13 Pro', '13', 'Redmi Note 13 Pro', 'Redmi Note 12', 'POCO F5', 'POCO X5 Pro'],
    gpuRenderer: 'Adreno 740',
  },
  'Oppo': {
    models: ['Find X7 Ultra', 'Find X6 Pro', 'Reno 11 Pro', 'Reno 10', 'A98', 'A78'],
    gpuRenderer: 'Mali-G610',
  },
  'Huawei': {
    models: ['Mate 60 Pro', 'P60 Pro', 'Mate 50 Pro', 'P50 Pro', 'Nova 11', 'Nova 10'],
    gpuRenderer: 'Mali-G78',
  },
  'Realme': {
    models: ['GT 5 Pro', 'GT Neo 5', '11 Pro+', '11 Pro', 'Narzo 60 Pro', 'C55'],
    gpuRenderer: 'Adreno 730',
  },
  'Sony': {
    models: ['Xperia 1 V', 'Xperia 5 V', 'Xperia 10 V', 'Xperia 1 IV', 'Xperia 5 IV'],
    gpuRenderer: 'Adreno 740',
  },
  'Motorola': {
    models: ['Edge 40 Pro', 'Edge 40', 'Razr 40 Ultra', 'Moto G84', 'Moto G73', 'ThinkPhone'],
    gpuRenderer: 'Adreno 730',
  },
  'Vivo': {
    models: ['X100 Pro', 'X90 Pro', 'V29 Pro', 'V27', 'Y100', 'iQOO 12'],
    gpuRenderer: 'Adreno 750',
  },
};

export const androidVersions = ['14', '13', '12', '11', '10'];
export const chromeVersions = ['120.0.6099.144', '119.0.6045.193', '118.0.5993.111', '117.0.5938.154', '116.0.5845.172', '115.0.5790.166', '121.0.6167.101', '122.0.6261.64', '123.0.6312.99', '124.0.6367.82'];

export const screenResolutions = [
  { w: 1080, h: 2400 }, { w: 1080, h: 2340 }, { w: 1440, h: 3200 },
  { w: 1440, h: 3120 }, { w: 1080, h: 2412 }, { w: 1284, h: 2778 },
  { w: 1080, h: 2376 }, { w: 1080, h: 2388 },
];

export function buildUserAgent(brand: string, model: string, osVersion: string, chromeVersion: string): string {
  const buildId = `TP1A.${Math.floor(Math.random() * 900000) + 100000}.${Math.floor(Math.random() * 900) + 100}`;
  return `Mozilla/5.0 (Linux; Android ${osVersion}; ${brand} ${model} Build/${buildId}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Mobile Safari/537.36`;
}
