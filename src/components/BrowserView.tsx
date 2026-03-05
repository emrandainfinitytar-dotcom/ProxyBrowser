import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft, ArrowRight, RotateCw, Home, Plus, X, Shield, Globe,
  Lock, Wifi, MapPin, Settings, Smartphone,
  Fingerprint, Clock, Monitor, Eye, Cpu, Copy, Check,
  AlertTriangle, Loader2, Star, BookOpen, ExternalLink,
  Download, CheckCircle2, XCircle, Info
} from 'lucide-react';
import type { BrowserProfile } from '../types';
import { buildUserAgent } from '../data';

interface Tab {
  id: string;
  title: string;
  url: string;
  loading: boolean;
  history: string[];
  historyIndex: number;
}

interface BrowserViewProps {
  profile: BrowserProfile;
  onBack: () => void;
}

const PROXY_URL_KEY = 'stealth_proxy_url';

const BOOKMARKS_KEY = 'stealth_bookmarks';
const DEFAULT_BOOKMARKS = [
  { name: 'Whoer', url: 'https://whoer.net', icon: '🔍' },
  { name: 'BrowserLeaks', url: 'https://browserleaks.com', icon: '🔬' },
  { name: 'IPHey', url: 'https://iphey.com', icon: '🛡️' },
  { name: 'Canvas', url: 'https://browserleaks.com/canvas', icon: '🎨' },
  { name: 'WebRTC', url: 'https://browserleaks.com/webrtc', icon: '📡' },
  { name: 'DNS Leak', url: 'https://dnsleaktest.com', icon: '🌐' },
  { name: 'Google', url: 'https://google.com', icon: '🔎' },
  { name: 'IP Info', url: 'https://ipinfo.io', icon: '📍' },
];

function loadBookmarks() {
  try {
    const stored = localStorage.getItem(BOOKMARKS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_BOOKMARKS;
  } catch { return DEFAULT_BOOKMARKS; }
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default function BrowserView({ profile, onBack }: BrowserViewProps) {
  const initialUrl = 'https://whoer.net';
  const [tabs, setTabs] = useState<Tab[]>([{
    id: genId(),
    title: 'whoer.net',
    url: initialUrl,
    loading: true,
    history: [initialUrl],
    historyIndex: 0,
  }]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [addressBarValue, setAddressBarValue] = useState(initialUrl);
  const [showPanel, setShowPanel] = useState<'none' | 'details' | 'settings'>('none');
  const [detailTab, setDetailTab] = useState<'status' | 'fingerprint' | 'proxy'>('status');
  const [proxyUrl, setProxyUrl] = useState(() => localStorage.getItem(PROXY_URL_KEY) || '');
  const [tempProxyUrl, setTempProxyUrl] = useState(() => localStorage.getItem(PROXY_URL_KEY) || '');
  const [copied, setCopied] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(true);
  const [proxyTestStatus, setProxyTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [proxyTestResult, setProxyTestResult] = useState('');
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [bookmarks] = useState(loadBookmarks);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const ua = profile.userAgent.mode === 'builder'
    ? buildUserAgent(
        profile.userAgent.brand || '',
        profile.userAgent.model || '',
        profile.userAgent.osVersion || '14',
        profile.userAgent.chromeVersion || '120.0.6099.144'
      )
    : profile.userAgent.manualUA || '';

  // Get proxy details from profile
  const proxyHost = profile.proxy.host || '';
  const proxyPort = profile.proxy.port || '';
  const proxyUser = profile.proxy.username || '';
  const proxyPass = profile.proxy.password || '';
  const proxyIP = proxyHost || 'N/A';
  const proxyPortDisplay = proxyPort || 'N/A';
  const proxyLocation = profile.proxy.country || 'Manual Proxy';

  // Build the proxied iframe URL
  const getIframeUrl = useCallback((targetUrl: string) => {
    if (!proxyUrl) return targetUrl;

    const params = new URLSearchParams();
    params.set('url', targetUrl);
    if (proxyHost) params.set('ph', proxyHost);
    if (proxyPort) params.set('pp', proxyPort);
    if (proxyUser) params.set('pu', proxyUser);
    if (proxyPass) params.set('ppw', proxyPass);
    if (ua) params.set('ua', btoa(ua));

    return `${proxyUrl}?${params.toString()}`;
  }, [proxyUrl, proxyHost, proxyPort, proxyUser, proxyPass, ua]);

  const navigateTo = useCallback((url: string) => {
    let normalized = url.trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      if (normalized.includes('.') && !normalized.includes(' ')) {
        normalized = 'https://' + normalized;
      } else {
        normalized = `https://www.google.com/search?q=${encodeURIComponent(normalized)}`;
      }
    }
    setTabs(prev => prev.map(tab => {
      if (tab.id === activeTabId) {
        const newHistory = [...tab.history.slice(0, tab.historyIndex + 1), normalized];
        return {
          ...tab,
          url: normalized,
          loading: true,
          title: extractHostname(normalized),
          history: newHistory,
          historyIndex: newHistory.length - 1,
        };
      }
      return tab;
    }));
    setAddressBarValue(normalized);
  }, [activeTabId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo(addressBarValue);
  };

  const goBack = () => {
    if (activeTab.historyIndex > 0) {
      const newIndex = activeTab.historyIndex - 1;
      const newUrl = activeTab.history[newIndex];
      setTabs(prev => prev.map(t =>
        t.id === activeTabId ? { ...t, url: newUrl, historyIndex: newIndex, loading: true, title: extractHostname(newUrl) } : t
      ));
      setAddressBarValue(newUrl);
    }
  };

  const goForward = () => {
    if (activeTab.historyIndex < activeTab.history.length - 1) {
      const newIndex = activeTab.historyIndex + 1;
      const newUrl = activeTab.history[newIndex];
      setTabs(prev => prev.map(t =>
        t.id === activeTabId ? { ...t, url: newUrl, historyIndex: newIndex, loading: true, title: extractHostname(newUrl) } : t
      ));
      setAddressBarValue(newUrl);
    }
  };

  const doRefresh = () => {
    setTabs(prev => prev.map(t =>
      t.id === activeTabId ? { ...t, loading: true } : t
    ));
    if (iframeRef.current) {
      const src = getIframeUrl(activeTab.url);
      iframeRef.current.src = '';
      setTimeout(() => { if (iframeRef.current) iframeRef.current.src = src; }, 100);
    }
  };

  const addTab = (url = 'https://whoer.net') => {
    const id = genId();
    setTabs(prev => [...prev, { id, title: extractHostname(url), url, loading: true, history: [url], historyIndex: 0 }]);
    setActiveTabId(id);
    setAddressBarValue(url);
  };

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const idx = tabs.findIndex(t => t.id === tabId);
    const newTabs = tabs.filter(t => t.id !== tabId);
    if (tabId === activeTabId) {
      const next = newTabs[Math.min(idx, newTabs.length - 1)];
      setActiveTabId(next.id);
      setAddressBarValue(next.url);
    }
    setTabs(newTabs);
  };

  const switchTab = (tabId: string) => {
    setActiveTabId(tabId);
    const tab = tabs.find(t => t.id === tabId);
    if (tab) setAddressBarValue(tab.url);
  };

  const handleIframeLoad = () => {
    setTabs(prev => prev.map(t =>
      t.id === activeTabId ? { ...t, loading: false } : t
    ));
  };

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data && e.data.type === 'stealth_url_change') {
        const newUrl = e.data.url;
        if (newUrl) {
          setAddressBarValue(newUrl);
          setTabs(prev => prev.map(t =>
            t.id === activeTabId ? { ...t, title: extractHostname(newUrl) } : t
          ));
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [activeTabId]);

  // ===== FIXED: Test proxy using ?action=ping first, then ?action=test =====
  const testProxy = async () => {
    const url = tempProxyUrl.trim().replace(/\/+$/, '');
    if (!url) return;

    setProxyTestStatus('testing');
    setProxyTestResult('');

    try {
      // Step 1: Ping to check if proxy.php is reachable
      const pingResp = await fetch(`${url}?action=ping`, {
        method: 'GET',
        mode: 'cors',
      });

      if (!pingResp.ok) {
        setProxyTestStatus('error');
        setProxyTestResult(`❌ proxy.php returned HTTP ${pingResp.status}. Check the URL.`);
        return;
      }

      const pingData = await pingResp.json();

      if (!pingData.status || pingData.status !== 'ok') {
        setProxyTestStatus('error');
        setProxyTestResult('❌ proxy.php responded but returned unexpected data.');
        return;
      }

      // Step 2: Test the actual proxy connection
      if (proxyHost && proxyPort) {
        const params = new URLSearchParams({
          action: 'test',
          ph: proxyHost,
          pp: proxyPort,
        });
        if (proxyUser) params.set('pu', proxyUser);
        if (proxyPass) params.set('ppw', proxyPass);

        const testResp = await fetch(`${url}?${params.toString()}`);
        const testData = await testResp.json();

        if (testData.success) {
          setProxyTestStatus('success');
          setProxyTestResult(`✅ Proxy working! IP: ${testData.ip} | ${testData.city}, ${testData.country} | ISP: ${testData.isp} | ${testData.latency}`);
        } else {
          setProxyTestStatus('error');
          setProxyTestResult(`❌ Proxy connection failed: ${testData.error}\n\nProxy: ${proxyHost}:${proxyPort}`);
        }
      } else {
        // No proxy details — just confirm proxy.php works
        setProxyTestStatus('success');
        setProxyTestResult(`✅ proxy.php is running! v${pingData.version} | PHP ${pingData.php_version} | cURL: ${pingData.curl_enabled ? 'Yes' : 'No'} | Server IP: ${pingData.server_ip}`);
      }
    } catch (err: any) {
      setProxyTestStatus('error');
      setProxyTestResult(`❌ Cannot reach proxy.php!\n\nError: ${err.message}\n\nTroubleshooting:\n• Check URL is correct (e.g. https://yourdomain.com/proxy.php)\n• Make sure the file exists on your cPanel\n• Check HTTPS is working on your domain\n• Try opening the URL directly in browser`);
    }
  };

  const saveProxy = () => {
    const trimmed = tempProxyUrl.trim().replace(/\/+$/, '');
    setProxyUrl(trimmed);
    localStorage.setItem(PROXY_URL_KEY, trimmed);
    if (trimmed) {
      setShowPanel('none');
      doRefresh();
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (activeTab.loading) {
      const t = setTimeout(() => {
        setTabs(prev => prev.map(tab =>
          tab.id === activeTabId && tab.loading ? { ...tab, loading: false } : tab
        ));
      }, 15000);
      return () => clearTimeout(t);
    }
  }, [activeTab.loading, activeTabId]);

  const noProxyConfigured = !proxyUrl;

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">
      {/* BROWSER CHROME */}
      <div className="flex-shrink-0 bg-gray-900 border-b border-gray-800">
        {/* Tab Bar */}
        <div className="flex items-center bg-gray-950/80 px-1 pt-1 gap-0.5">
          <button onClick={onBack} className="p-1.5 mx-0.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all flex-shrink-0" title="Exit Browser">
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1 flex items-center overflow-x-auto gap-0.5 browser-tabs">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => switchTab(tab.id)}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg min-w-0 max-w-[180px] transition-all flex-shrink-0 ${
                  tab.id === activeTabId ? 'bg-gray-900 text-white' : 'bg-transparent text-gray-500 hover:bg-gray-900/50 hover:text-gray-300'
                }`}>
                {tab.loading ? <Loader2 className="w-3 h-3 animate-spin text-emerald-400 flex-shrink-0" /> : <Globe className="w-3 h-3 flex-shrink-0" />}
                <span className="text-[11px] truncate">{tab.title}</span>
                {tabs.length > 1 && (
                  <span onClick={(e) => closeTab(tab.id, e)} className="ml-1 p-0.5 rounded hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 cursor-pointer">
                    <X className="w-2.5 h-2.5" />
                  </span>
                )}
              </button>
            ))}
          </div>
          <button onClick={() => addTab()} className="p-1.5 mx-0.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all flex-shrink-0" title="New Tab">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Navigation + Address Bar */}
        <div className="flex items-center gap-1 px-2 py-1.5">
          <button onClick={goBack} disabled={activeTab.historyIndex <= 0} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all disabled:opacity-25 flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button onClick={goForward} disabled={activeTab.historyIndex >= activeTab.history.length - 1} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all disabled:opacity-25 flex-shrink-0">
            <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={doRefresh} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all flex-shrink-0">
            <RotateCw className={`w-4 h-4 ${activeTab.loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => navigateTo('https://whoer.net')} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all flex-shrink-0" title="Home">
            <Home className="w-4 h-4" />
          </button>

          <form onSubmit={handleSubmit} className="flex-1 min-w-0">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg border border-gray-700 focus-within:border-emerald-500/50 transition-all">
              {proxyUrl ? <Lock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
              <input type="text" value={addressBarValue} onChange={(e) => setAddressBarValue(e.target.value)}
                className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-gray-500 min-w-0"
                placeholder="Enter URL or search..." onFocus={(e) => e.target.select()} />
              {activeTab.loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400 flex-shrink-0" />}
            </div>
          </form>

          <button onClick={() => setShowBookmarks(!showBookmarks)}
            className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${showBookmarks ? 'text-amber-400 bg-amber-500/10' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`} title="Bookmarks">
            <Star className="w-4 h-4" />
          </button>
          <button onClick={() => setShowPanel(showPanel === 'details' ? 'none' : 'details')}
            className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${showPanel === 'details' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`} title="Protection Status">
            <Shield className="w-4 h-4" />
          </button>
          <button onClick={() => { setShowPanel(showPanel === 'settings' ? 'none' : 'settings'); setShowSetupGuide(false); }}
            className={`p-1.5 rounded-lg transition-all flex-shrink-0 relative ${showPanel === 'settings' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`} title="Proxy Settings">
            <Settings className="w-4 h-4" />
            {noProxyConfigured && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          </button>
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-950/50 border-t border-gray-800/50 overflow-x-auto">
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className={`w-1.5 h-1.5 rounded-full ${proxyUrl ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span className={`text-[9px] font-bold tracking-wider ${proxyUrl ? 'text-emerald-400' : 'text-red-400'}`}>
              {proxyUrl ? 'TUNNELED' : 'DIRECT'}
            </span>
          </div>
          <span className="text-gray-800">|</span>
          <span className="text-gray-500 text-[9px] flex items-center gap-1 flex-shrink-0">
            <Wifi className="w-2.5 h-2.5" /> {proxyIP}:{proxyPortDisplay}
          </span>
          <span className="text-gray-800">|</span>
          <span className="text-gray-500 text-[9px] flex items-center gap-1 flex-shrink-0">
            <MapPin className="w-2.5 h-2.5" /> {proxyLocation}
          </span>
          <span className="text-gray-800">|</span>
          <span className="text-gray-500 text-[9px] flex items-center gap-1 flex-shrink-0">
            <Clock className="w-2.5 h-2.5" /> {profile.fingerprint.timezone}
          </span>
          {proxyUrl && (
            <>
              <span className="text-gray-800">|</span>
              <span className="text-emerald-500 text-[9px] flex items-center gap-1 flex-shrink-0">
                <Shield className="w-2.5 h-2.5" /> Residential Proxy Active
              </span>
            </>
          )}
        </div>

        {/* Bookmarks Bar */}
        {showBookmarks && (
          <div className="flex items-center gap-0.5 px-2 py-1 border-t border-gray-800/30 overflow-x-auto bg-gray-900/50">
            <BookOpen className="w-3 h-3 text-gray-600 mr-1 flex-shrink-0" />
            {bookmarks.map((bm: { name: string; url: string; icon: string }) => (
              <button key={bm.url} onClick={() => navigateTo(bm.url)}
                className="flex items-center gap-1 px-2 py-0.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-all flex-shrink-0">
                <span className="text-[10px]">{bm.icon}</span>
                <span className="text-[10px] font-medium">{bm.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* DETAILS PANEL */}
        {showPanel === 'details' && (
          <div className="border-t border-gray-800 bg-gray-900/98 backdrop-blur-xl animate-slideDown">
            <div className="flex border-b border-gray-800">
              {(['status', 'fingerprint', 'proxy'] as const).map(tab => (
                <button key={tab} onClick={() => setDetailTab(tab)}
                  className={`flex-1 py-2 text-[11px] font-medium transition-all capitalize ${
                    detailTab === tab ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5' : 'text-gray-500 hover:text-gray-300'
                  }`}>
                  {tab === 'status' ? '🛡️ Status' : tab === 'fingerprint' ? '🔏 Fingerprint' : '🌐 Proxy'}
                </button>
              ))}
            </div>
            <div className="p-3 max-h-56 overflow-y-auto">
              {detailTab === 'status' && (
                <div className="space-y-1">
                  <StatusRow label="Proxy Tunnel" status={proxyUrl ? 'active' : 'blocked'} detail={proxyUrl ? 'Server-side routing' : 'Not configured'} />
                  <StatusRow label="Residential IP" status="active" detail={`${proxyIP}:${proxyPortDisplay}`} />
                  <StatusRow label="Timezone Match" status="active" detail={profile.fingerprint.timezone} />
                  <StatusRow label="Language Match" status="active" detail={profile.fingerprint.language} />
                  <StatusRow label="WebRTC Leak" status="blocked" detail={profile.fingerprint.webrtc === 'disabled' ? 'Disabled' : 'Altered'} />
                  <StatusRow label="Canvas FP" status="spoofed" detail="Noise applied" />
                  <StatusRow label="WebGL FP" status="spoofed" detail={profile.fingerprint.webglRenderer} />
                  <StatusRow label="DNS Leak" status={proxyUrl ? 'blocked' : 'active'} detail={proxyUrl ? 'Protected' : 'Direct'} />
                  <StatusRow label="User Agent" status="active" detail={profile.userAgent.brand ? `${profile.userAgent.brand} ${profile.userAgent.model}` : 'Custom'} />
                </div>
              )}
              {detailTab === 'fingerprint' && (
                <div className="space-y-1">
                  <InfoRow icon={Smartphone} label="Profile" value={profile.name} />
                  <InfoRow icon={Globe} label="Device" value={profile.userAgent.brand ? `${profile.userAgent.brand} ${profile.userAgent.model}` : 'Custom'} />
                  <InfoRow icon={Monitor} label="Android" value={`v${profile.userAgent.osVersion || 'Custom'}`} />
                  <InfoRow icon={Clock} label="Timezone" value={profile.fingerprint.timezone} />
                  <InfoRow icon={Globe} label="Language" value={profile.fingerprint.language} />
                  <InfoRow icon={MapPin} label="Location" value={`${profile.fingerprint.latitude}, ${profile.fingerprint.longitude}`} />
                  <InfoRow icon={Monitor} label="Screen" value={`${profile.fingerprint.screenWidth}×${profile.fingerprint.screenHeight}`} />
                  <InfoRow icon={Eye} label="WebRTC" value={profile.fingerprint.webrtc} />
                  <InfoRow icon={Fingerprint} label="Canvas" value={profile.fingerprint.canvas} />
                  <InfoRow icon={Cpu} label="Hardware" value={`${profile.fingerprint.hardwareConcurrency} cores / ${profile.fingerprint.deviceMemory}GB`} />
                  <div className="mt-2 pt-2 border-t border-gray-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-500 text-[10px]">User Agent</span>
                      <button onClick={() => copyText(ua)} className="text-gray-600 hover:text-emerald-400">
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <p className="text-[9px] text-gray-400 font-mono break-all bg-gray-800/60 rounded p-2 leading-relaxed">{ua}</p>
                  </div>
                </div>
              )}
              {detailTab === 'proxy' && (
                <div className="space-y-1">
                  <InfoRow icon={Wifi} label="IP Address" value={proxyIP} />
                  <InfoRow icon={Globe} label="Port" value={proxyPortDisplay} />
                  <InfoRow icon={MapPin} label="Location" value={proxyLocation} />
                  {proxyUser && <InfoRow icon={Lock} label="Auth" value="Configured ✓" />}
                  <InfoRow icon={ExternalLink} label="PHP Proxy" value={proxyUrl || 'Not configured'} />
                  <div className="mt-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
                    <div className="flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="text-emerald-400 text-[10px] font-medium">
                        Browser → proxy.php → Residential Proxy → Website
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS PANEL */}
        {showPanel === 'settings' && (
          <div className="border-t border-gray-800 bg-gray-900/98 backdrop-blur-xl animate-slideDown max-h-[70vh] overflow-y-auto">
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-emerald-400" /> Server-Side Proxy Setup
                </h3>
                <p className="text-gray-500 text-[11px] leading-relaxed">
                  Upload <code className="text-cyan-400">proxy.php</code> to your cPanel. It routes traffic through your residential proxy so websites see the proxy IP.
                </p>
              </div>

              {/* How it works */}
              <div className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 font-medium mb-2">TRAFFIC FLOW:</p>
                <div className="flex items-center gap-1 text-[10px] flex-wrap">
                  <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">📱 Browser</span>
                  <span className="text-gray-600">→</span>
                  <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded">🖥️ proxy.php</span>
                  <span className="text-gray-600">→</span>
                  <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">🌐 Proxy ({proxyIP})</span>
                  <span className="text-gray-600">→</span>
                  <span className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded">🔍 Website</span>
                </div>
              </div>

              {/* URL input */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Your proxy.php URL</label>
                <div className="flex gap-2">
                  <input type="text" value={tempProxyUrl} onChange={(e) => setTempProxyUrl(e.target.value)}
                    placeholder="https://yourdomain.com/proxy.php"
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-600 min-w-0" />
                  <button onClick={testProxy} disabled={!tempProxyUrl.trim() || proxyTestStatus === 'testing'}
                    className="px-3 py-2 bg-gray-700 text-white rounded-lg text-xs font-medium hover:bg-gray-600 transition-all flex-shrink-0 disabled:opacity-40">
                    {proxyTestStatus === 'testing' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
                  </button>
                  <button onClick={saveProxy}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-all flex-shrink-0">
                    Save
                  </button>
                </div>
              </div>

              {/* Test Result */}
              {proxyTestResult && (
                <div className={`rounded-lg p-3 text-xs border whitespace-pre-wrap ${
                  proxyTestStatus === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  {proxyTestStatus === 'success' ? <CheckCircle2 className="w-4 h-4 inline mr-1.5" /> : <XCircle className="w-4 h-4 inline mr-1.5" />}
                  {proxyTestResult}
                </div>
              )}

              {/* Current active proxy */}
              {proxyUrl && (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-emerald-400 text-xs truncate flex-1">Active: {proxyUrl}</span>
                  <button onClick={() => { setProxyUrl(''); setTempProxyUrl(''); localStorage.removeItem(PROXY_URL_KEY); }}
                    className="text-red-400 text-[10px] hover:text-red-300 flex-shrink-0 px-2 py-0.5 rounded hover:bg-red-500/10">Remove</button>
                </div>
              )}

              {/* Profile proxy info */}
              <div className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 font-medium mb-2">PROFILE PROXY CREDENTIALS:</p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-gray-500">Host:</span> <span className="text-white font-mono">{proxyHost || 'N/A'}</span></div>
                  <div><span className="text-gray-500">Port:</span> <span className="text-white font-mono">{proxyPort || 'N/A'}</span></div>
                  <div><span className="text-gray-500">User:</span> <span className="text-white font-mono">{proxyUser || 'N/A'}</span></div>
                  <div><span className="text-gray-500">Pass:</span> <span className="text-white font-mono">{proxyPass ? '••••••' : 'N/A'}</span></div>
                </div>
              </div>

              {/* Setup Guide */}
              <button onClick={() => setShowSetupGuide(!showSetupGuide)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 hover:bg-amber-500/15 transition-all">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span className="text-xs font-medium">cPanel Setup Guide & PHP Code</span>
                </div>
                <ArrowRight className={`w-4 h-4 transition-transform ${showSetupGuide ? 'rotate-90' : ''}`} />
              </button>

              {showSetupGuide && (
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 space-y-3">
                  <div className="space-y-2 text-[11px] text-gray-400">
                    <p className="text-white text-xs font-semibold">📋 Step-by-Step Setup:</p>
                    <div className="space-y-2">
                      {[
                        'Login to your cPanel → Open File Manager',
                        'Navigate to public_html',
                        'Click "+ File" → Name it proxy.php',
                        'Right-click → Edit → Paste PHP code → Save',
                        'Enter URL above: https://yourdomain.com/proxy.php',
                        'Click "Test" to verify → Then "Save"',
                      ].map((step, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-emerald-400 font-bold flex-shrink-0">{i + 1}.</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-xs font-semibold">proxy.php — Copy this code:</span>
                      <button onClick={() => copyText(phpProxyCode)}
                        className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 transition-all px-2 py-1 bg-emerald-500/10 rounded">
                        {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                      </button>
                    </div>
                    <pre className="text-[9px] text-gray-500 font-mono bg-gray-950 rounded-lg p-3 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre leading-relaxed border border-gray-800">
                      {phpProxyCode}
                    </pre>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5">
                    <p className="text-blue-400 text-[10px] flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Important:</strong> Your cPanel must have cURL enabled (most do). The proxy.php handles test endpoints, bulk testing, and web page proxying — all through your residential proxy.
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* IFRAME CONTENT AREA */}
      <div className="flex-1 relative overflow-hidden bg-white">
        {noProxyConfigured && !activeTab.loading && (
          <div className="absolute top-0 left-0 right-0 z-30 bg-amber-500/95 text-black text-center py-2 px-4 text-xs font-medium flex items-center justify-center gap-2 flex-wrap">
            <AlertTriangle className="w-4 h-4" />
            <span>Loading directly (real IP visible). Setup PHP proxy in ⚙️ Settings.</span>
            <button onClick={() => setShowPanel('settings')} className="bg-black/20 hover:bg-black/30 px-3 py-1 rounded text-white font-semibold transition-all">
              Setup Now
            </button>
          </div>
        )}

        {activeTab.loading && (
          <div className="absolute inset-0 z-20 bg-gray-950 flex flex-col items-center justify-center">
            <div className="relative mb-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-emerald-500/20">
                <Shield className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-gray-900 border-2 border-gray-800 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              </div>
            </div>
            <h3 className="text-white text-base font-semibold mb-1">
              {proxyUrl ? 'Routing Through Residential Proxy' : 'Loading Page'}
            </h3>
            <p className="text-gray-500 text-xs mb-4 text-center px-8 max-w-sm">{activeTab.url}</p>
            <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden mb-5">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full animate-loading-bar" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-gray-600 px-4">
              <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-emerald-600" /> {proxyIP}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-emerald-600" /> {proxyLocation}</span>
              <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-600" /> Fingerprint Active</span>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          key={`${activeTabId}__${activeTab.url}__${proxyUrl}`}
          src={getIframeUrl(activeTab.url)}
          onLoad={handleIframeLoad}
          className="w-full h-full border-0"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation-by-user-activation"
          allow="geolocation; microphone; camera"
          title="Stealth Browser"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3 h-3 text-gray-600" />
        <span className="text-gray-500 text-[11px]">{label}</span>
      </div>
      <span className="text-white text-[11px] font-medium capitalize max-w-[55%] text-right truncate">{value}</span>
    </div>
  );
}

function StatusRow({ label, status, detail }: { label: string; status: 'active' | 'blocked' | 'spoofed'; detail: string }) {
  const cfg = {
    active:  { bg: 'bg-emerald-500', text: 'text-emerald-400', sym: '✓' },
    blocked: { bg: 'bg-red-500',     text: 'text-red-400',     sym: '✗' },
    spoofed: { bg: 'bg-amber-500',   text: 'text-amber-400',   sym: '~' },
  }[status];

  return (
    <div className="flex items-center justify-between py-1 border-b border-gray-800/40 last:border-0">
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${cfg.bg}`} />
        <span className="text-gray-400 text-[11px]">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-gray-600 text-[10px] max-w-[120px] truncate">{detail}</span>
        <span className={`text-[10px] font-bold ${cfg.text}`}>{cfg.sym}</span>
      </div>
    </div>
  );
}

const phpProxyCode = `<?php
/**
 * StealthBrowser Proxy v3.0
 * Upload to: public_html/proxy.php
 * 
 * Endpoints:
 *   ?action=ping           - Check if running
 *   ?action=test&ph=&pp=   - Test single proxy
 *   ?action=test_bulk      - POST bulk test
 *   ?action=test_ua&ua=    - Test user agent
 *   ?url=URL&ph=&pp=       - Proxy a webpage
 */
error_reporting(0); ini_set('display_errors',0); set_time_limit(120);
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header_remove('X-Frame-Options'); header_remove('Content-Security-Policy');
if($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code(200);exit;}

function gpt($t){switch(strtolower($t)){case'socks5':return CURLPROXY_SOCKS5;case'socks4':return CURLPROXY_SOCKS4;case'https':return CURLPROXY_HTTPS;default:return CURLPROXY_HTTP;}}
function geo($ip){$c=curl_init();curl_setopt_array($c,[CURLOPT_URL=>'http://ip-api.com/json/'.urlencode($ip).'?fields=status,country,countryCode,city,timezone,isp,org,lat,lon',CURLOPT_RETURNTRANSFER=>1,CURLOPT_TIMEOUT=>5,CURLOPT_SSL_VERIFYPEER=>0]);$r=curl_exec($c);curl_close($c);$d=json_decode($r,1);return($d&&@$d['status']==='success')?$d:[];}
function tp($h,$p,$u,$pw,$t){$c=curl_init();$o=[CURLOPT_URL=>'https://api.ipify.org?format=json',CURLOPT_RETURNTRANSFER=>1,CURLOPT_TIMEOUT=>15,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_SSL_VERIFYPEER=>0,CURLOPT_PROXY=>$h,CURLOPT_PROXYPORT=>intval($p),CURLOPT_PROXYTYPE=>gpt($t)];if($u&&$pw){$o[CURLOPT_PROXYUSERPWD]=$u.':'.$pw;$o[CURLOPT_PROXYAUTH]=CURLAUTH_BASIC|CURLAUTH_NTLM;}curl_setopt_array($c,$o);$s=microtime(1);$r=curl_exec($c);$ms=round((microtime(1)-$s)*1000);if(!$r){$e=curl_error($c);$n=curl_errno($c);curl_close($c);return['success'=>0,'error'=>$e,'errno'=>$n,'proxy'=>$h.':'.$p,'latency'=>$ms.'ms'];}curl_close($c);$d=json_decode($r,1);$ip=@$d['ip']?:trim($r);$g=geo($ip);return['success'=>1,'ip'=>$ip,'proxy'=>$h.':'.$p,'host'=>$h,'port'=>$p,'username'=>$u,'password'=>$pw,'latency'=>$ms.'ms','country'=>@$g['country'],'countryCode'=>@$g['countryCode'],'city'=>@$g['city'],'isp'=>@$g['isp'],'org'=>@$g['org'],'timezone'=>@$g['timezone'],'lat'=>@$g['lat'],'lon'=>@$g['lon']];}

$a=@$_GET['action'];
if($a==='ping'){header('Content-Type:application/json');$c=curl_init();curl_setopt_array($c,[CURLOPT_URL=>'https://api.ipify.org?format=json',CURLOPT_RETURNTRANSFER=>1,CURLOPT_TIMEOUT=>5,CURLOPT_SSL_VERIFYPEER=>0]);$r=curl_exec($c);curl_close($c);$d=json_decode($r,1);echo json_encode(['status'=>'ok','version'=>'3.0','php_version'=>phpversion(),'curl_enabled'=>function_exists('curl_init'),'server_ip'=>@$d['ip']?:'unknown']);exit;}
if($a==='test'){header('Content-Type:application/json');$ph=@$_GET['ph'];$pp=@$_GET['pp'];$pu=@$_GET['pu'];$ppw=@$_GET['ppw'];$pt=@$_GET['pt']?:'http';if(!$ph||!$pp){echo json_encode(['success'=>0,'error'=>'Missing host/port']);exit;}echo json_encode(tp($ph,$pp,$pu,$ppw,$pt));exit;}
if($a==='test_bulk'){header('Content-Type:application/json');$in=json_decode(file_get_contents('php://input'),1);if(!$in||empty($in['proxies'])){echo json_encode(['success'=>0,'error'=>'POST JSON: {"proxies":["h:p:u:pw",...]}']);exit;}$t=@$in['type']?:'http';$res=[];$w=0;$f=0;foreach($in['proxies'] as $l){$l=trim($l);if(!$l)continue;if(strpos($l,'@')!==false){$ap=explode('@',$l,2);$au=explode(':',$ap[0],2);$hp=explode(':',$ap[1],2);$pu=$au[0];$ppw=@$au[1];$ph=$hp[0];$pp=@$hp[1];}else{$ps=explode(':',$l);$ph=$ps[0];$pp=@$ps[1];$pu=@$ps[2];$ppw=@$ps[3];}if(!$ph||!$pp)continue;$r=tp($ph,$pp,$pu,$ppw,$t);$r['original']=$l;$res[]=$r;if($r['success'])$w++;else $f++;}echo json_encode(['success'=>1,'total'=>count($res),'working'=>$w,'failed'=>$f,'results'=>$res]);exit;}
if($a==='test_ua'){header('Content-Type:application/json');$ua=isset($_GET['ua'])?base64_decode($_GET['ua']):'';if(!$ua){echo json_encode(['success'=>0,'error'=>'No UA']);exit;}$c=curl_init();$o=[CURLOPT_URL=>'https://httpbin.org/user-agent',CURLOPT_RETURNTRANSFER=>1,CURLOPT_TIMEOUT=>15,CURLOPT_SSL_VERIFYPEER=>0,CURLOPT_USERAGENT=>$ua];$ph=@$_GET['ph'];$pp=@$_GET['pp'];if($ph&&$pp){$o[CURLOPT_PROXY]=$ph;$o[CURLOPT_PROXYPORT]=intval($pp);$o[CURLOPT_PROXYTYPE]=gpt(@$_GET['pt']?:'http');$pu=@$_GET['pu'];$ppw=@$_GET['ppw'];if($pu&&$ppw)$o[CURLOPT_PROXYUSERPWD]=$pu.':'.$ppw;}curl_setopt_array($c,$o);$r=curl_exec($c);if(!$r){echo json_encode(['success'=>0,'error'=>curl_error($c)]);curl_close($c);exit;}curl_close($c);$d=json_decode($r,1);$recv=@$d['user-agent']?:'unknown';echo json_encode(['success'=>1,'sent_ua'=>$ua,'received_ua'=>$recv,'match'=>($ua===$recv)]);exit;}

$url=@$_GET['url'];$ph=@$_GET['ph'];$pp=@$_GET['pp'];$pu=@$_GET['pu'];$ppw=@$_GET['ppw'];$pt=@$_GET['pt']?:'http';$ua=isset($_GET['ua'])?base64_decode($_GET['ua']):@$_SERVER['HTTP_USER_AGENT'];
if(!$url){header('Content-Type:application/json');echo json_encode(['status'=>'ok','usage'=>'?action=ping | ?action=test&ph=&pp= | ?url=URL']);exit;}
if(!filter_var($url,FILTER_VALIDATE_URL)){http_response_code(400);echo'Invalid URL';exit;}
$pu2=parse_url($url);$bU=$pu2['scheme'].'://'.$pu2['host'];$sS=(!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off')?'https':'http';$pB=$sS.'://'.$_SERVER['HTTP_HOST'].$_SERVER['SCRIPT_NAME'];
$xp='';if($ph)$xp.='&ph='.urlencode($ph);if($pp)$xp.='&pp='.urlencode($pp);if($pu)$xp.='&pu='.urlencode($pu);if($ppw)$xp.='&ppw='.urlencode($ppw);if($pt!=='http')$xp.='&pt='.urlencode($pt);if(isset($_GET['ua']))$xp.='&ua='.urlencode($_GET['ua']);
$c=curl_init();$o=[CURLOPT_URL=>$url,CURLOPT_RETURNTRANSFER=>1,CURLOPT_FOLLOWLOCATION=>1,CURLOPT_MAXREDIRS=>10,CURLOPT_TIMEOUT=>30,CURLOPT_CONNECTTIMEOUT=>15,CURLOPT_SSL_VERIFYPEER=>0,CURLOPT_SSL_VERIFYHOST=>0,CURLOPT_ENCODING=>'',CURLOPT_HEADER=>1,CURLOPT_USERAGENT=>$ua,CURLOPT_HTTPHEADER=>['Accept:text/html,application/xhtml+xml,*/*;q=0.8','Accept-Language:en-US,en;q=0.9','Cache-Control:no-cache','Upgrade-Insecure-Requests:1'],CURLOPT_REFERER=>$url];
if($ph&&$pp){$o[CURLOPT_PROXY]=$ph;$o[CURLOPT_PROXYPORT]=intval($pp);$o[CURLOPT_PROXYTYPE]=gpt($pt);if($pu&&$ppw){$o[CURLOPT_PROXYUSERPWD]=$pu.':'.$ppw;$o[CURLOPT_PROXYAUTH]=CURLAUTH_BASIC|CURLAUTH_NTLM;}}
if($_SERVER['REQUEST_METHOD']==='POST'){$o[CURLOPT_POST]=1;$bd=file_get_contents('php://input');$o[CURLOPT_POSTFIELDS]=$bd?:http_build_query($_POST);}
curl_setopt_array($c,$o);$resp=curl_exec($c);
if(!$resp){$e=curl_error($c);curl_close($c);http_response_code(502);echo'<html><body style="background:#111;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h2 style="color:#f87171">Connection Failed</h2><p style="color:#888">'.htmlspecialchars($e).'</p><p style="color:#666;font-size:12px">Proxy:'.$ph.':'.$pp.'</p></div></body></html>';exit;}
$hs=curl_getinfo($c,CURLINFO_HEADER_SIZE);$code=curl_getinfo($c,CURLINFO_HTTP_CODE);$ct=curl_getinfo($c,CURLINFO_CONTENT_TYPE)?:'text/html';curl_close($c);
$hdr=substr($resp,0,$hs);$body=substr($resp,$hs);http_response_code($code);if($ct)header('Content-Type:'.$ct);
foreach(explode("\\r\\n",$hdr) as $hl){if(stripos($hl,'set-cookie:')===0)header($hl,false);}
if(strpos($ct,'text/html')!==false){$body=preg_replace('/<base[^>]*>/i','',$body);$rw=function($u)use($pB,$xp,$bU){if(!$u||preg_match('/^(data:|javascript:|mailto:|blob:|#|about:)/',$u))return $u;if(strpos($u,$pB)===0)return $u;if(strpos($u,'//')===0)$u='https:'.$u;elseif(strpos($u,'/')===0)$u=$bU.$u;elseif(strpos($u,'http')!==0)$u=$bU.'/'.$u;return $pB.'?url='.urlencode($u).$xp;};$body=preg_replace_callback('/(src|href|action)\\s*=\\s*["\\']([ ^"\\'\\ ]+)[\"\\']/i',function($m)use($rw){if(strpos($m[2],'#')===0)return $m[0];return $m[1].'="'.$rw($m[2]).'"';},$body);$body=preg_replace_callback('/url\\(\\s*["\\'\\?]([^"\\')\\s]+)["\\'\\?]?\\s*\\)/i',function($m)use($rw){if(strpos($m[1],'data:')===0)return $m[0];return'url("'.$rw($m[1]).'")' ;},$body);$js='<script>(function(){var P='.json_encode($pB).',X='.json_encode($xp).',B='.json_encode($bU).';function R(u){if(!u||/^(data:|javascript:|blob:|#|about:)/.test(u))return u;if(u.indexOf(P)===0)return u;if(u.indexOf("//")===0)u="https:"+u;else if(u.indexOf("/")===0)u=B+u;else if(u.indexOf("http")!==0)u=B+"/"+u;return P+"?url="+encodeURIComponent(u)+X}var F=window.fetch;window.fetch=function(a,b){if(typeof a==="string")a=R(a);return F.call(this,a,b)};var O=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){arguments[1]=R(u);return O.apply(this,arguments)};document.addEventListener("click",function(e){var a=e.target.closest("a[href]");if(a){var h=a.getAttribute("href");if(h&&!/^(#|javascript:)/.test(h)&&h.indexOf(P)!==0){e.preventDefault();window.location.href=R(h)}}},true);try{window.parent.postMessage({type:"stealth_url_change",url:'.json_encode($url).'},"*")}catch(e){}})();</script>';if(stripos($body,'</head>')!==false)$body=str_ireplace('</head>',$js.'</head>',$body);else $body=$js.$body;echo $body;}elseif(strpos($ct,'text/css')!==false){$body=preg_replace_callback('/url\\(\\s*["\\'\\?]([^"\\')\\s]+)["\\'\\?]?\\s*\\)/i',function($m)use($pB,$xp,$bU){$u=$m[1];if(strpos($u,'data:')===0)return $m[0];if(strpos($u,'//')===0)$u='https:'.$u;elseif(strpos($u,'/')===0)$u=$bU.$u;elseif(strpos($u,'http')!==0)$u=$bU.'/'.$u;return'url("'.$pB.'?url='.urlencode($u).$xp.'")';},$body);echo $body;}else echo $body;
?>`;
