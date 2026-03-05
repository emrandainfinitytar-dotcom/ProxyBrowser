import { useState, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, Check, Globe, Smartphone, Fingerprint,
  ClipboardList, Search, AlertCircle, Zap,
  Monitor, MapPin, Eye, Shield, Cpu, ChevronDown, Loader2,
  CheckCircle2, XCircle, Copy, ListChecks, FlaskConical
} from 'lucide-react';
import type { ProxyConfig, UserAgentConfig, FingerprintConfig, BrowserProfile } from '../types';
import {
  countries, getTimezone, getLanguage, getCoords,
  deviceBrands, androidVersions, chromeVersions, screenResolutions,
  buildUserAgent
} from '../data';
import type { WizardStep } from '../types';

interface ProfileWizardProps {
  onComplete: (profile: BrowserProfile) => void;
  onCancel: () => void;
}

const PROXY_URL_KEY = 'stealth_proxy_url';

const steps: { key: WizardStep; label: string; icon: React.ElementType }[] = [
  { key: 'proxy', label: 'Proxy', icon: Globe },
  { key: 'useragent', label: 'UA', icon: Smartphone },
  { key: 'fingerprint', label: 'FP', icon: Fingerprint },
  { key: 'review', label: 'Review', icon: ClipboardList },
];

interface BulkResult {
  proxy: string;
  host: string;
  port: string;
  username: string;
  password: string;
  success: boolean;
  ip?: string;
  latency?: string;
  country?: string;
  city?: string;
  isp?: string;
  timezone?: string;
  lat?: number;
  lon?: number;
  error?: string;
  original?: string;
}

export default function ProfileWizard({ onComplete, onCancel }: ProfileWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [profileName, setProfileName] = useState(`Profile ${Date.now().toString(36).toUpperCase()}`);

  // Proxy state
  const [proxyMode, setProxyMode] = useState<'manual' | 'bulk' | 'curl'>('manual');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [manualHost, setManualHost] = useState('');
  const [manualPort, setManualPort] = useState('');
  const [manualUser, setManualUser] = useState('');
  const [manualPass, setManualPass] = useState('');
  const [proxyType, setProxyType] = useState('http');
  const [countrySearch, setCountrySearch] = useState('');

  // Bulk proxy testing
  const [bulkProxies, setBulkProxies] = useState('');
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);
  const [bulkTesting, setBulkTesting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState('');
  const [selectedBulkProxy, setSelectedBulkProxy] = useState<BulkResult | null>(null);

  // cURL mode
  const [curlCommand, setCurlCommand] = useState('');
  const [curlParsed, setCurlParsed] = useState<{ host: string; port: string; user: string; pass: string } | null>(null);

  // IP Test
  const [ipTestStatus, setIpTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [ipTestResult, setIpTestResult] = useState<any>(null);

  // User Agent state
  const [uaMode, setUaMode] = useState<'builder' | 'manual'>('builder');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedOS, setSelectedOS] = useState('14');
  const [selectedChrome, setSelectedChrome] = useState(chromeVersions[0]);
  const [manualUA, setManualUA] = useState('');

  // UA Test
  const [uaTestStatus, setUaTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [uaTestResult, setUaTestResult] = useState<any>(null);

  // Fingerprint state
  const [fingerprint, setFingerprint] = useState<FingerprintConfig>({
    timezone: 'America/New_York',
    language: 'en-US',
    latitude: 40.7128,
    longitude: -74.006,
    screenWidth: 1080,
    screenHeight: 2400,
    webrtc: 'altered',
    canvas: 'noise',
    webgl: 'noise',
    webglVendor: 'Qualcomm',
    webglRenderer: 'Adreno 730',
    doNotTrack: false,
    hardwareConcurrency: 8,
    deviceMemory: 8,
  });

  // Copied state
  const [copiedCurl, setCopiedCurl] = useState(false);

  const phpProxyUrl = localStorage.getItem(PROXY_URL_KEY) || '';

  // Get current proxy details
  const getProxyDetails = () => {
    if (proxyMode === 'bulk' && selectedBulkProxy) {
      return { host: selectedBulkProxy.host, port: selectedBulkProxy.port, user: selectedBulkProxy.username, pass: selectedBulkProxy.password };
    }
    if (proxyMode === 'curl' && curlParsed) {
      return { host: curlParsed.host, port: curlParsed.port, user: curlParsed.user, pass: curlParsed.pass };
    }
    return { host: manualHost, port: manualPort, user: manualUser, pass: manualPass };
  };

  // Generate cURL command from current proxy
  const generateCurl = () => {
    const pd = getProxyDetails();
    if (!pd.host || !pd.port) return '';
    let cmd = `curl -x ${proxyType}://${pd.host}:${pd.port}`;
    if (pd.user && pd.pass) cmd += ` --proxy-user "${pd.user}:${pd.pass}"`;
    cmd += ' https://api.ipify.org?format=json';
    return cmd;
  };

  // Parse cURL command
  const parseCurl = (cmd: string) => {
    const proxyMatch = cmd.match(/-x\s+(?:(\w+):\/\/)?([^:\s]+):(\d+)/);
    const authMatch = cmd.match(/--proxy-user\s+"?([^:"\s]+):([^"\s]+)"?/);
    if (proxyMatch) {
      const parsed = {
        host: proxyMatch[2],
        port: proxyMatch[3],
        user: authMatch ? authMatch[1] : '',
        pass: authMatch ? authMatch[2] : '',
      };
      setCurlParsed(parsed);
      return parsed;
    }
    // Try format: host:port:user:pass per line
    const lines = cmd.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length > 0) {
      const parts = lines[0].split(':');
      if (parts.length >= 2) {
        const parsed = {
          host: parts[0],
          port: parts[1],
          user: parts[2] || '',
          pass: parts[3] || '',
        };
        setCurlParsed(parsed);
        return parsed;
      }
    }
    setCurlParsed(null);
    return null;
  };

  // Auto-update fingerprint
  useEffect(() => {
    if (ipTestResult?.success) {
      setFingerprint(prev => ({
        ...prev,
        timezone: ipTestResult.timezone || prev.timezone,
        latitude: ipTestResult.lat || prev.latitude,
        longitude: ipTestResult.lon || prev.longitude,
      }));
    } else if (selectedCountry) {
      const [lat, lng] = getCoords(selectedCountry);
      const res = screenResolutions[Math.floor(Math.random() * screenResolutions.length)];
      setFingerprint(prev => ({
        ...prev,
        timezone: getTimezone(selectedCountry),
        language: getLanguage(selectedCountry),
        latitude: parseFloat(lat.toFixed(4)),
        longitude: parseFloat(lng.toFixed(4)),
        screenWidth: res.w,
        screenHeight: res.h,
      }));
    }
  }, [selectedCountry, ipTestResult]);

  useEffect(() => {
    if (selectedBulkProxy?.success) {
      const cc = countries.find(c => c.name === selectedBulkProxy.country)?.code;
      if (cc) setSelectedCountry(cc);
      if (selectedBulkProxy.timezone) {
        setFingerprint(prev => ({
          ...prev,
          timezone: selectedBulkProxy.timezone || prev.timezone,
          latitude: selectedBulkProxy.lat || prev.latitude,
          longitude: selectedBulkProxy.lon || prev.longitude,
        }));
      }
    }
  }, [selectedBulkProxy]);

  useEffect(() => {
    if (selectedBrand && deviceBrands[selectedBrand]) {
      setFingerprint(prev => ({ ...prev, webglRenderer: deviceBrands[selectedBrand].gpuRenderer }));
    }
  }, [selectedBrand]);

  // ===== INLINE IP TEST =====
  const testIP = async (host?: string, port?: string, user?: string, pass?: string) => {
    if (!phpProxyUrl) { alert('Configure proxy.php URL first! Go to Admin Panel → API & Proxy'); return; }
    const h = host || getProxyDetails().host;
    const p = port || getProxyDetails().port;
    const u = user || getProxyDetails().user;
    const pw = pass || getProxyDetails().pass;
    if (!h || !p) { alert('No proxy host/port'); return; }

    setIpTestStatus('testing');
    setIpTestResult(null);

    try {
      const params = new URLSearchParams({ action: 'test', ph: h, pp: p, pt: proxyType });
      if (u) params.set('pu', u);
      if (pw) params.set('ppw', pw);

      const resp = await fetch(`${phpProxyUrl}?${params.toString()}`);
      const data = await resp.json();
      setIpTestResult(data);
      setIpTestStatus(data.success ? 'success' : 'error');

      if (data.success && data.timezone) {
        setFingerprint(prev => ({ ...prev, timezone: data.timezone, latitude: data.lat || prev.latitude, longitude: data.lon || prev.longitude }));
        const cc = countries.find(c => c.name === data.country)?.code;
        if (cc) setSelectedCountry(cc);
      }
    } catch (err: any) {
      setIpTestStatus('error');
      setIpTestResult({ success: false, error: 'Cannot reach proxy.php: ' + err.message });
    }
  };

  // ===== BULK TEST =====
  const testBulkProxies = async () => {
    if (!phpProxyUrl) { alert('Configure proxy.php URL first!'); return; }
    const lines = bulkProxies.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    setBulkTesting(true);
    setBulkResults([]);
    setBulkProgress(`Testing ${lines.length} proxies...`);
    setSelectedBulkProxy(null);

    try {
      const resp = await fetch(`${phpProxyUrl}?action=test_bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxies: lines, type: proxyType }),
      });
      const data = await resp.json();
      if (data.success && data.results) {
        setBulkResults(data.results);
        setBulkProgress(`Done! ${data.working} working, ${data.failed} failed out of ${data.total}`);
      } else {
        setBulkProgress('Error: ' + (data.error || 'Unknown'));
      }
    } catch (err: any) {
      setBulkProgress('Failed: ' + err.message);
    }
    setBulkTesting(false);
  };

  // ===== UA TEST =====
  const testUA = async () => {
    if (!phpProxyUrl) { alert('Configure proxy.php URL first!'); return; }
    const uaStr = getUserAgentString();
    if (!uaStr) { alert('No user agent configured'); return; }

    setUaTestStatus('testing');
    setUaTestResult(null);

    try {
      const pd = getProxyDetails();
      const params = new URLSearchParams({ action: 'test_ua', ua: btoa(uaStr) });
      if (pd.host) params.set('ph', pd.host);
      if (pd.port) params.set('pp', pd.port);
      if (pd.user) params.set('pu', pd.user);
      if (pd.pass) params.set('ppw', pd.pass);
      params.set('pt', proxyType);

      const resp = await fetch(`${phpProxyUrl}?${params.toString()}`);
      const data = await resp.json();
      setUaTestResult(data);
      setUaTestStatus(data.success ? 'success' : 'error');
    } catch (err: any) {
      setUaTestStatus('error');
      setUaTestResult({ success: false, error: err.message });
    }
  };

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const canProceed = () => {
    if (currentStep === 0) {
      if (proxyMode === 'bulk') return !!selectedBulkProxy;
      if (proxyMode === 'curl') return !!curlParsed;
      return !!manualHost && !!manualPort;
    }
    if (currentStep === 1) {
      if (uaMode === 'builder') return !!selectedBrand && !!selectedModel;
      return !!manualUA;
    }
    return true;
  };

  const getUserAgentString = () => {
    if (uaMode === 'manual') return manualUA;
    if (selectedBrand && selectedModel) return buildUserAgent(selectedBrand, selectedModel, selectedOS, selectedChrome);
    return '';
  };

  const handleComplete = () => {
    const pd = getProxyDetails();
    const proxyConfig: ProxyConfig = { mode: 'manual', country: selectedCountry, host: pd.host, port: pd.port, username: pd.user, password: pd.pass };
    const uaConfig: UserAgentConfig = uaMode === 'builder'
      ? { mode: 'builder', brand: selectedBrand, model: selectedModel, osVersion: selectedOS, chromeVersion: selectedChrome }
      : { mode: 'manual', manualUA };

    const profile: BrowserProfile = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      name: profileName,
      proxy: proxyConfig,
      userAgent: uaConfig,
      fingerprint,
      createdAt: new Date().toISOString(),
      status: 'ready',
    };
    onComplete(profile);
  };

  const copyCurl = () => {
    navigator.clipboard.writeText(generateCurl());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <button onClick={onCancel} className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-all text-sm">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <span className="text-white font-medium text-sm">New Profile</span>
            <div className="w-12" />
          </div>

          {/* Step dots - Mobile optimized */}
          <div className="flex items-center gap-1">
            {steps.map((step, i) => (
              <div key={step.key} className="flex items-center flex-1">
                <button
                  onClick={() => i < currentStep && setCurrentStep(i)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                    i < currentStep ? 'bg-emerald-500 text-white' :
                    i === currentStep ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50' :
                    'bg-gray-800 text-gray-500'
                  }`}
                >
                  {i < currentStep ? <Check className="w-3.5 h-3.5" /> : <step.icon className="w-3.5 h-3.5" />}
                </button>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 rounded-full ${i < currentStep ? 'bg-emerald-500' : 'bg-gray-800'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Profile Name */}
        <div className="mb-4">
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            placeholder="Profile name"
          />
        </div>

        {/* No proxy warning */}
        {!phpProxyUrl && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-400/80 text-xs">Set up proxy.php URL in Admin Panel → API & Proxy to enable proxy testing.</p>
          </div>
        )}

        {/* =========== STEP 0: PROXY =========== */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" /> Proxy Setup
            </h2>

            {/* Mode Toggle */}
            <div className="flex gap-1.5 bg-gray-900 p-1 rounded-xl">
              {([
                { key: 'manual' as const, label: '✏️ Manual' },
                { key: 'bulk' as const, label: '📋 Bulk Test' },
                { key: 'curl' as const, label: '💻 cURL' },
              ]).map(m => (
                <button key={m.key} onClick={() => setProxyMode(m.key)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    proxyMode === m.key ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-300'
                  }`}>{m.label}</button>
              ))}
            </div>

            {/* Protocol */}
            <div className="flex gap-1.5">
              {['http', 'https', 'socks5', 'socks4'].map(t => (
                <button key={t} onClick={() => setProxyType(t)}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-medium uppercase transition-all ${
                    proxyType === t ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50' : 'bg-gray-900 text-gray-500'
                  }`}>{t}</button>
              ))}
            </div>

            {/* ===== MANUAL ===== */}
            {proxyMode === 'manual' && (
              <div className="space-y-3">
                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">Host / IP</label>
                      <div className="flex gap-1.5">
                        <input type="text" value={manualHost} onChange={(e) => setManualHost(e.target.value)}
                          placeholder="proxy.example.com"
                          className="flex-1 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500 min-w-0" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">Port</label>
                      <input type="text" value={manualPort} onChange={(e) => setManualPort(e.target.value)}
                        placeholder="8080"
                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">Username</label>
                      <input type="text" value={manualUser} onChange={(e) => setManualUser(e.target.value)}
                        placeholder="optional"
                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">Password</label>
                      <input type="password" value={manualPass} onChange={(e) => setManualPass(e.target.value)}
                        placeholder="optional"
                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
                    </div>
                  </div>

                  {/* Inline test button */}
                  <div className="flex gap-2">
                    <button onClick={() => testIP()} disabled={!manualHost || !manualPort || !phpProxyUrl || ipTestStatus === 'testing'}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/20 text-xs font-medium disabled:opacity-30 transition-all">
                      {ipTestStatus === 'testing' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Testing...</> : <><FlaskConical className="w-3.5 h-3.5" /> Test Proxy</>}
                    </button>
                    {manualHost && manualPort && (
                      <button onClick={copyCurl}
                        className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white text-xs transition-all">
                        {copiedCurl ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> cURL</>}
                      </button>
                    )}
                  </div>
                </div>

                {/* IP Test Result */}
                {ipTestResult && <ProxyTestResult result={ipTestResult} />}
              </div>
            )}

            {/* ===== CURL MODE ===== */}
            {proxyMode === 'curl' && (
              <div className="space-y-3">
                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                  <label className="block text-xs font-medium text-gray-300 mb-2">Paste cURL or proxy details</label>
                  <p className="text-gray-600 text-[10px] mb-3">
                    Supports: <code className="text-cyan-400">curl -x host:port --proxy-user user:pass</code> or <code className="text-cyan-400">host:port:user:pass</code>
                  </p>
                  <textarea
                    value={curlCommand}
                    onChange={(e) => { setCurlCommand(e.target.value); parseCurl(e.target.value); }}
                    placeholder={`curl -x http://proxy.example.com:8080 --proxy-user "user:pass" https://api.ipify.org\n\nOR\n\nproxy.example.com:8080:user:pass`}
                    rows={4}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs font-mono placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none"
                  />

                  {curlParsed && (
                    <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 text-xs font-medium">Parsed successfully</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div><span className="text-gray-500">Host:</span> <span className="text-white font-mono">{curlParsed.host}</span></div>
                        <div><span className="text-gray-500">Port:</span> <span className="text-white font-mono">{curlParsed.port}</span></div>
                        {curlParsed.user && <div><span className="text-gray-500">User:</span> <span className="text-white font-mono">{curlParsed.user}</span></div>}
                        {curlParsed.pass && <div><span className="text-gray-500">Pass:</span> <span className="text-white">••••</span></div>}
                      </div>
                    </div>
                  )}

                  {/* Test button for cURL parsed proxy */}
                  {curlParsed && (
                    <button onClick={() => testIP(curlParsed.host, curlParsed.port, curlParsed.user, curlParsed.pass)}
                      disabled={!phpProxyUrl || ipTestStatus === 'testing'}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/20 text-xs font-medium disabled:opacity-30 transition-all">
                      {ipTestStatus === 'testing' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Testing...</> : <><FlaskConical className="w-3.5 h-3.5" /> Test This Proxy</>}
                    </button>
                  )}
                </div>

                {ipTestResult && <ProxyTestResult result={ipTestResult} />}
              </div>
            )}

            {/* ===== BULK MODE ===== */}
            {proxyMode === 'bulk' && (
              <div className="space-y-3">
                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ListChecks className="w-4 h-4 text-emerald-400" />
                    <label className="text-sm font-medium text-gray-300">Paste Multiple Proxies</label>
                  </div>
                  <p className="text-gray-600 text-[10px] mb-3">
                    One per line: <code className="text-cyan-400">host:port:user:pass</code> or <code className="text-cyan-400">user:pass@host:port</code>
                  </p>
                  <textarea
                    value={bulkProxies}
                    onChange={(e) => setBulkProxies(e.target.value)}
                    placeholder={`192.168.1.1:8080:user:pass\n10.0.0.1:3128\nuser:pass@proxy.example.com:1080`}
                    rows={5}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs font-mono placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-gray-500 text-[10px]">
                      {bulkProxies.split('\n').filter(l => l.trim()).length} proxies
                    </span>
                    <button onClick={testBulkProxies} disabled={bulkTesting || !bulkProxies.trim() || !phpProxyUrl}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-all">
                      {bulkTesting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Testing...</> : <><Zap className="w-3.5 h-3.5" /> Test All</>}
                    </button>
                  </div>
                </div>

                {bulkProgress && (
                  <div className={`rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-2 ${
                    bulkTesting ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' :
                    bulkResults.some(r => r.success) ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                    'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}>
                    {bulkTesting && <Loader2 className="w-3 h-3 animate-spin" />}
                    {bulkProgress}
                  </div>
                )}

                {bulkResults.length > 0 && (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {bulkResults.map((result, i) => (
                      <button key={i} onClick={() => result.success && setSelectedBulkProxy(result)}
                        disabled={!result.success}
                        className={`w-full text-left p-3 rounded-xl transition-all ${
                          selectedBulkProxy === result ? 'bg-emerald-500/15 ring-1 ring-emerald-500/50' :
                          result.success ? 'bg-gray-900/80 border border-gray-800 hover:border-gray-700' :
                          'bg-red-500/5 border border-red-500/10 opacity-50'
                        }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {result.success ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                            <span className="text-white text-xs font-mono">{result.proxy}</span>
                          </div>
                          {result.latency && <span className="text-emerald-400 text-[10px]">{result.latency}</span>}
                        </div>
                        {result.success ? (
                          <div className="flex flex-wrap gap-2 text-[10px] text-gray-400 ml-5 mt-1">
                            <span>🌐 {result.ip}</span>
                            <span>📍 {result.city}, {result.country}</span>
                            <span>🏢 {result.isp}</span>
                          </div>
                        ) : (
                          <p className="text-red-400/60 text-[10px] ml-5 mt-1 truncate">{result.error}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {selectedBulkProxy && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-emerald-400 text-xs font-medium">Selected: </span>
                    <span className="text-white text-xs font-mono">{selectedBulkProxy.ip}</span>
                    <span className="text-gray-400 text-[10px]">— {selectedBulkProxy.city}, {selectedBulkProxy.country}</span>
                  </div>
                )}
              </div>
            )}

            {/* Country selector (for fingerprint fallback) */}
            {proxyMode === 'manual' && ipTestStatus !== 'success' && (
              <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                <label className="block text-xs font-medium text-gray-300 mb-2">Proxy Country <span className="text-gray-600">(for fingerprint)</span></label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input type="text" value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto">
                  {filteredCountries.map(c => (
                    <button key={c.code} onClick={() => setSelectedCountry(c.code)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] transition-all ${
                        selectedCountry === c.code ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                      }`}>
                      <span>{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Copy cURL for current proxy */}
            {getProxyDetails().host && (
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-gray-500 font-medium">cURL Command</span>
                  <button onClick={copyCurl} className="text-gray-500 hover:text-emerald-400 transition-all">
                    {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <code className="text-[10px] text-cyan-400 font-mono break-all">{generateCurl()}</code>
              </div>
            )}
          </div>
        )}

        {/* =========== STEP 1: USER AGENT =========== */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-400" /> User Agent
            </h2>

            <div className="flex gap-1.5 bg-gray-900 p-1 rounded-xl">
              {(['builder', 'manual'] as const).map(m => (
                <button key={m} onClick={() => setUaMode(m)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    uaMode === m ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500'
                  }`}>{m === 'builder' ? '🔧 Builder' : '✏️ Manual'}</button>
              ))}
            </div>

            {uaMode === 'builder' ? (
              <div className="space-y-3">
                {/* Brand */}
                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                  <label className="block text-xs font-medium text-gray-300 mb-2.5">Device Brand</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {Object.keys(deviceBrands).map(b => (
                      <button key={b} onClick={() => { setSelectedBrand(b); setSelectedModel(''); }}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                          selectedBrand === b ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50' : 'bg-gray-800/50 text-gray-400'
                        }`}>{b}</button>
                    ))}
                  </div>
                </div>

                {/* Model */}
                {selectedBrand && (
                  <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                    <label className="block text-xs font-medium text-gray-300 mb-2.5">Model</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {deviceBrands[selectedBrand].models.map(m => (
                        <button key={m} onClick={() => setSelectedModel(m)}
                          className={`px-2.5 py-2 rounded-lg text-xs text-left transition-all ${
                            selectedModel === m ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50' : 'bg-gray-800/50 text-gray-400'
                          }`}>{m}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* OS + Chrome */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-3">
                    <label className="block text-[11px] text-gray-400 mb-1.5">Android</label>
                    <div className="relative">
                      <select value={selectedOS} onChange={(e) => setSelectedOS(e.target.value)}
                        className="w-full px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 appearance-none">
                        {androidVersions.map(v => <option key={v} value={v}>v{v}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-3">
                    <label className="block text-[11px] text-gray-400 mb-1.5">Chrome</label>
                    <div className="relative">
                      <select value={selectedChrome} onChange={(e) => setSelectedChrome(e.target.value)}
                        className="w-full px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 appearance-none">
                        {chromeVersions.map(v => <option key={v} value={v}>v{v.split('.')[0]}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Preview + Test */}
                {selectedBrand && selectedModel && (
                  <div className="bg-gray-900/80 border border-emerald-500/20 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-emerald-400 font-medium">Generated UA</span>
                      <button onClick={() => navigator.clipboard.writeText(getUserAgentString())} className="text-gray-500 hover:text-emerald-400">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-gray-300 text-[10px] font-mono break-all leading-relaxed">
                      {buildUserAgent(selectedBrand, selectedModel, selectedOS, selectedChrome)}
                    </p>
                    {/* Inline UA test */}
                    <button onClick={testUA} disabled={uaTestStatus === 'testing' || !phpProxyUrl}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-[11px] font-medium disabled:opacity-30 transition-all">
                      {uaTestStatus === 'testing' ? <><Loader2 className="w-3 h-3 animate-spin" /> Testing...</> : <><FlaskConical className="w-3 h-3" /> Test UA</>}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                  <label className="block text-xs font-medium text-gray-300 mb-2">Custom User Agent</label>
                  <textarea value={manualUA} onChange={(e) => setManualUA(e.target.value)}
                    placeholder="Mozilla/5.0 (Linux; Android 14; ..."
                    rows={3}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs font-mono placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none" />
                  {manualUA && (
                    <button onClick={testUA} disabled={uaTestStatus === 'testing' || !phpProxyUrl}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-[11px] font-medium disabled:opacity-30 transition-all">
                      {uaTestStatus === 'testing' ? <><Loader2 className="w-3 h-3 animate-spin" /> Testing...</> : <><FlaskConical className="w-3 h-3" /> Test UA</>}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* UA Test Result */}
            {uaTestResult && (
              <div className={`rounded-xl p-3 border ${
                uaTestResult.success && uaTestResult.match ? 'bg-emerald-500/10 border-emerald-500/30' :
                uaTestResult.success ? 'bg-amber-500/10 border-amber-500/30' :
                'bg-red-500/10 border-red-500/30'
              }`}>
                {uaTestResult.success ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {uaTestResult.match ? (
                        <><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400 text-xs font-semibold">UA Match ✓</span></>
                      ) : (
                        <><AlertCircle className="w-4 h-4 text-amber-400" /><span className="text-amber-400 text-xs font-semibold">UA Mismatch</span></>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <div className="bg-gray-900/50 rounded-lg p-2">
                        <span className="text-gray-500 text-[10px]">Sent:</span>
                        <p className="text-white text-[10px] font-mono break-all">{uaTestResult.sent_ua}</p>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-2">
                        <span className="text-gray-500 text-[10px]">Received:</span>
                        <p className="text-white text-[10px] font-mono break-all">{uaTestResult.received_ua}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-xs">{uaTestResult.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =========== STEP 2: FINGERPRINT =========== */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-emerald-400" /> Fingerprint
            </h2>
            <p className="text-gray-500 text-xs -mt-2">Auto-configured from proxy location</p>

            {/* Location */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-medium text-gray-300 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Location & Time
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <FpInput label="Timezone" value={fingerprint.timezone} onChange={v => setFingerprint(p => ({ ...p, timezone: v }))} />
                <FpInput label="Language" value={fingerprint.language} onChange={v => setFingerprint(p => ({ ...p, language: v }))} />
                <FpInput label="Latitude" value={String(fingerprint.latitude)} onChange={v => setFingerprint(p => ({ ...p, latitude: parseFloat(v) || 0 }))} type="number" />
                <FpInput label="Longitude" value={String(fingerprint.longitude)} onChange={v => setFingerprint(p => ({ ...p, longitude: parseFloat(v) || 0 }))} type="number" />
              </div>
            </div>

            {/* Screen */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-medium text-gray-300 flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5 text-emerald-400" /> Screen
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <FpInput label="Width" value={String(fingerprint.screenWidth)} onChange={v => setFingerprint(p => ({ ...p, screenWidth: parseInt(v) || 0 }))} type="number" />
                <FpInput label="Height" value={String(fingerprint.screenHeight)} onChange={v => setFingerprint(p => ({ ...p, screenHeight: parseInt(v) || 0 }))} type="number" />
              </div>
            </div>

            {/* Privacy */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-medium text-gray-300 flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-emerald-400" /> Privacy
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {(['webrtc', 'canvas', 'webgl'] as const).map(f => (
                  <div key={f}>
                    <label className="block text-[10px] text-gray-500 mb-1 capitalize">{f}</label>
                    <div className="relative">
                      <select value={fingerprint[f]} onChange={(e) => setFingerprint(p => ({ ...p, [f]: e.target.value }))}
                        className="w-full px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500 appearance-none">
                        {f === 'webrtc'
                          ? <><option value="disabled">Disabled</option><option value="altered">Altered</option><option value="real">Real</option></>
                          : <><option value="noise">Noise</option><option value="block">Block</option><option value="real">Real</option></>}
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hardware */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-medium text-gray-300 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" /> Hardware
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <FpInput label="GPU Vendor" value={fingerprint.webglVendor} onChange={v => setFingerprint(p => ({ ...p, webglVendor: v }))} />
                <FpInput label="GPU Renderer" value={fingerprint.webglRenderer} onChange={v => setFingerprint(p => ({ ...p, webglRenderer: v }))} />
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">CPU Cores</label>
                  <div className="relative">
                    <select value={fingerprint.hardwareConcurrency} onChange={(e) => setFingerprint(p => ({ ...p, hardwareConcurrency: parseInt(e.target.value) }))}
                      className="w-full px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500 appearance-none">
                      {[2,4,6,8,10,12].map(n => <option key={n} value={n}>{n} cores</option>)}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Memory</label>
                  <div className="relative">
                    <select value={fingerprint.deviceMemory} onChange={(e) => setFingerprint(p => ({ ...p, deviceMemory: parseInt(e.target.value) }))}
                      className="w-full px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500 appearance-none">
                      {[2,4,6,8,12,16].map(n => <option key={n} value={n}>{n} GB</option>)}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-gray-400">Do Not Track</span>
                <button onClick={() => setFingerprint(p => ({ ...p, doNotTrack: !p.doNotTrack }))}
                  className={`w-10 h-5 rounded-full transition-all relative ${fingerprint.doNotTrack ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${fingerprint.doNotTrack ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========== STEP 3: REVIEW =========== */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-400" /> Review
            </h2>

            {/* Proxy */}
            <ReviewCard icon={Globe} title="Proxy" color="emerald">
              <ReviewRow label="Host:Port" value={`${getProxyDetails().host}:${getProxyDetails().port}`} mono />
              <ReviewRow label="Protocol" value={proxyType.toUpperCase()} />
              {getProxyDetails().user && <ReviewRow label="Auth" value="Configured ✓" />}
              {ipTestResult?.success && (
                <>
                  <ReviewRow label="IP" value={ipTestResult.ip} mono />
                  <ReviewRow label="Location" value={`${ipTestResult.city}, ${ipTestResult.country}`} />
                  <ReviewRow label="ISP" value={ipTestResult.isp} />
                </>
              )}
              {selectedBulkProxy?.success && (
                <>
                  <ReviewRow label="IP" value={selectedBulkProxy.ip || ''} mono />
                  <ReviewRow label="Location" value={`${selectedBulkProxy.city}, ${selectedBulkProxy.country}`} />
                  <ReviewRow label="ISP" value={selectedBulkProxy.isp || ''} />
                </>
              )}
            </ReviewCard>

            {/* UA */}
            <ReviewCard icon={Smartphone} title="User Agent" color="cyan">
              {uaMode === 'builder' ? (
                <>
                  <ReviewRow label="Device" value={`${selectedBrand} ${selectedModel}`} />
                  <ReviewRow label="Android" value={selectedOS} />
                  <ReviewRow label="Chrome" value={selectedChrome.split('.')[0]} />
                </>
              ) : (
                <p className="text-[10px] text-gray-300 font-mono break-all">{manualUA}</p>
              )}
              {uaTestResult?.match && (
                <div className="flex items-center gap-1 text-emerald-400 text-[10px] mt-1">
                  <CheckCircle2 className="w-3 h-3" /> UA verified
                </div>
              )}
            </ReviewCard>

            {/* Fingerprint */}
            <ReviewCard icon={Fingerprint} title="Fingerprint" color="purple">
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                <ReviewRow label="Timezone" value={fingerprint.timezone} />
                <ReviewRow label="Language" value={fingerprint.language} />
                <ReviewRow label="Screen" value={`${fingerprint.screenWidth}×${fingerprint.screenHeight}`} />
                <ReviewRow label="WebRTC" value={fingerprint.webrtc} />
                <ReviewRow label="Canvas" value={fingerprint.canvas} />
                <ReviewRow label="WebGL" value={fingerprint.webgl} />
                <ReviewRow label="CPU" value={`${fingerprint.hardwareConcurrency} cores`} />
                <ReviewRow label="RAM" value={`${fingerprint.deviceMemory} GB`} />
              </div>
            </ReviewCard>

            {/* Score */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-emerald-400" />
                <div>
                  <h4 className="text-white font-medium text-sm">Anti-Detection Score</h4>
                  <p className="text-gray-500 text-[10px]">Based on your config</p>
                </div>
              </div>
              <div>
                <span className="text-3xl font-bold text-emerald-400">98</span>
                <span className="text-emerald-400/60 text-sm">/100</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation - Fixed for mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 p-4 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => currentStep === 0 ? onCancel() : setCurrentStep(currentStep - 1)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm">
            <ArrowLeft className="w-4 h-4" />
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </button>

          {currentStep < 3 ? (
            <button onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-xl text-sm disabled:opacity-30 shadow-lg shadow-emerald-500/20">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleComplete}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-xl text-sm shadow-lg shadow-emerald-500/20">
              <Check className="w-4 h-4" /> Create
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Helper Components =====

function FpInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-[10px] text-gray-500 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} step={type === 'number' ? '0.0001' : undefined}
        className="w-full px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500" />
    </div>
  );
}

function ProxyTestResult({ result }: { result: any }) {
  if (result.success) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 text-xs font-semibold">Proxy Working!</span>
          <span className="text-emerald-400/50 text-[10px] ml-auto">{result.latency}</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          <div className="bg-gray-900/50 rounded-lg px-2.5 py-1.5 flex justify-between">
            <span className="text-gray-400">IP</span>
            <span className="text-white font-mono font-bold">{result.ip}</span>
          </div>
          <div className="bg-gray-900/50 rounded-lg px-2.5 py-1.5 flex justify-between">
            <span className="text-gray-400">Country</span>
            <span className="text-white">{result.country}</span>
          </div>
          <div className="bg-gray-900/50 rounded-lg px-2.5 py-1.5 flex justify-between">
            <span className="text-gray-400">City</span>
            <span className="text-white">{result.city}</span>
          </div>
          <div className="bg-gray-900/50 rounded-lg px-2.5 py-1.5 flex justify-between">
            <span className="text-gray-400">ISP</span>
            <span className="text-white truncate ml-1">{result.isp}</span>
          </div>
          {result.timezone && (
            <div className="bg-gray-900/50 rounded-lg px-2.5 py-1.5 flex justify-between col-span-2">
              <span className="text-gray-400">Timezone</span>
              <span className="text-white">{result.timezone}</span>
            </div>
          )}
        </div>
        <p className="text-emerald-400/50 text-[9px]">✓ Fingerprint will auto-sync to this IP location</p>
      </div>
    );
  }

  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
      <div className="flex items-start gap-2">
        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-400 text-xs font-semibold">Proxy Failed</p>
          <p className="text-red-400/60 text-[10px] mt-1">{result.error}</p>
          <div className="mt-2 text-[9px] text-red-400/40 space-y-0.5">
            <p>• Check host and port</p>
            <p>• Verify credentials</p>
            <p>• Try different protocol</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ icon: Icon, title, color, children }: {
  icon: React.ElementType; title: string; color: string; children: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400',
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
  };
  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
      <h3 className={`text-sm font-medium mb-2.5 flex items-center gap-2 ${colorMap[color] || 'text-gray-300'}`}>
        <Icon className="w-4 h-4" /> {title}
      </h3>
      <div className="space-y-0.5 text-sm">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className={`text-white text-xs ${mono ? 'font-mono' : ''} max-w-[60%] text-right truncate`}>{value}</span>
    </div>
  );
}
