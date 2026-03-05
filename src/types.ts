export interface ProxyConfig {
  mode: 'api' | 'manual';
  country?: string;
  selectedProxy?: ProxyResult;
  host?: string;
  port?: string;
  username?: string;
  password?: string;
  apiUsername?: string;
  apiPassword?: string;
}

export interface ProxyResult {
  ip: string;
  port: string;
  country: string;
  city: string;
  isp: string;
  speed: string;
  type: string;
  latency: string;
}

export interface UserAgentConfig {
  mode: 'builder' | 'manual';
  brand?: string;
  model?: string;
  osVersion?: string;
  chromeVersion?: string;
  manualUA?: string;
}

export interface FingerprintConfig {
  timezone: string;
  language: string;
  latitude: number;
  longitude: number;
  screenWidth: number;
  screenHeight: number;
  webrtc: 'disabled' | 'altered' | 'real';
  canvas: 'noise' | 'block' | 'real';
  webgl: 'noise' | 'block' | 'real';
  webglVendor: string;
  webglRenderer: string;
  doNotTrack: boolean;
  hardwareConcurrency: number;
  deviceMemory: number;
}

export interface BrowserProfile {
  id: string;
  name: string;
  proxy: ProxyConfig;
  userAgent: UserAgentConfig;
  fingerprint: FingerprintConfig;
  createdAt: string;
  status: 'ready' | 'running' | 'stopped';
}

export interface AccessCode {
  code: string;
  label: string;
  createdAt: string;
  active: boolean;
  lastUsed?: string;
}

export interface AdminSettings {
  proxyApiUrl: string;
  proxyApiKey: string;
  phpProxyUrl: string;
  bookmarks: Bookmark[];
}

export interface Bookmark {
  name: string;
  url: string;
  icon: string;
}

export type AppPage = 'access' | 'dashboard' | 'wizard' | 'browser' | 'admin';
export type WizardStep = 'proxy' | 'useragent' | 'fingerprint' | 'review';
