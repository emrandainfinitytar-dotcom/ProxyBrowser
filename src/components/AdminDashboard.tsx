import { useState, useEffect } from 'react';
import {
  ArrowLeft, Shield, Key, Users, Globe, Bookmark, Settings,
  Plus, Trash2, Copy, Check, ToggleLeft, ToggleRight,
  RefreshCw, Save, AlertCircle, CheckCircle2
} from 'lucide-react';
import type { AccessCode, Bookmark as BookmarkType } from '../types';

interface AdminDashboardProps {
  onBack: () => void;
}

const ACCESS_CODES_KEY = 'stealth_access_codes';
const ADMIN_SETTINGS_KEY = 'stealth_admin_settings';
const PROXY_URL_KEY = 'stealth_proxy_url';
const BOOKMARKS_KEY = 'stealth_bookmarks';

const DEFAULT_BOOKMARKS: BookmarkType[] = [
  { name: 'Whoer', url: 'https://whoer.net', icon: '🔍' },
  { name: 'BrowserLeaks', url: 'https://browserleaks.com', icon: '🔬' },
  { name: 'IPHey', url: 'https://iphey.com', icon: '🛡️' },
  { name: 'Canvas Test', url: 'https://browserleaks.com/canvas', icon: '🎨' },
  { name: 'WebRTC Test', url: 'https://browserleaks.com/webrtc', icon: '📡' },
  { name: 'DNS Leak', url: 'https://dnsleaktest.com', icon: '🌐' },
  { name: 'Google', url: 'https://google.com', icon: '🔎' },
  { name: 'IP Info', url: 'https://ipinfo.io', icon: '📍' },
];

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    if (i > 0) code += '-';
    for (let j = 0; j < 4; j++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return code;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'codes' | 'api' | 'bookmarks' | 'settings'>('codes');
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [copied, setCopied] = useState('');
  const [saved, setSaved] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  // API settings
  const [proxyApiUrl, setProxyApiUrl] = useState('');
  const [proxyApiKey, setProxyApiKey] = useState('');
  const [phpProxyUrl, setPhpProxyUrl] = useState('');

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>(DEFAULT_BOOKMARKS);
  const [newBmName, setNewBmName] = useState('');
  const [newBmUrl, setNewBmUrl] = useState('');
  const [newBmIcon, setNewBmIcon] = useState('🌐');

  // Load data
  useEffect(() => {
    try {
      const storedCodes = localStorage.getItem(ACCESS_CODES_KEY);
      if (storedCodes) setCodes(JSON.parse(storedCodes));

      const storedSettings = localStorage.getItem(ADMIN_SETTINGS_KEY);
      if (storedSettings) {
        const s = JSON.parse(storedSettings);
        setProxyApiUrl(s.proxyApiUrl || '');
        setProxyApiKey(s.proxyApiKey || '');
      }

      const storedProxy = localStorage.getItem(PROXY_URL_KEY);
      if (storedProxy) setPhpProxyUrl(storedProxy);

      const storedBm = localStorage.getItem(BOOKMARKS_KEY);
      if (storedBm) setBookmarks(JSON.parse(storedBm));
    } catch { /* ignore */ }
  }, []);

  // Save codes
  const saveCodes = (newCodes: AccessCode[]) => {
    setCodes(newCodes);
    localStorage.setItem(ACCESS_CODES_KEY, JSON.stringify(newCodes));
  };

  const generateNewCode = () => {
    const code: AccessCode = {
      code: generateCode(),
      label: newLabel || `User ${codes.length + 1}`,
      createdAt: new Date().toISOString(),
      active: true,
    };
    saveCodes([code, ...codes]);
    setNewLabel('');
  };

  const toggleCode = (codeStr: string) => {
    saveCodes(codes.map(c => c.code === codeStr ? { ...c, active: !c.active } : c));
  };

  const deleteCode = (codeStr: string) => {
    saveCodes(codes.filter(c => c.code !== codeStr));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(''), 2000);
  };

  const saveApiSettings = () => {
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify({ proxyApiUrl, proxyApiKey }));
    localStorage.setItem(PROXY_URL_KEY, phpProxyUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveBookmarks = () => {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addBookmark = () => {
    if (!newBmName || !newBmUrl) return;
    const bm: BookmarkType = { name: newBmName, url: newBmUrl, icon: newBmIcon };
    const updated = [...bookmarks, bm];
    setBookmarks(updated);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
    setNewBmName('');
    setNewBmUrl('');
    setNewBmIcon('🌐');
  };

  const removeBookmark = (idx: number) => {
    const updated = bookmarks.filter((_, i) => i !== idx);
    setBookmarks(updated);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
  };

  const tabs = [
    { key: 'codes' as const, label: 'Access Codes', icon: Key },
    { key: 'api' as const, label: 'API & Proxy', icon: Globe },
    { key: 'bookmarks' as const, label: 'Bookmarks', icon: Bookmark },
    { key: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-all text-sm">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-400" />
              <span className="text-white font-semibold text-sm">Admin Panel</span>
            </div>
            <div className="w-16" />
          </div>
        </div>
      </div>

      {/* Tab Navigation - Scrollable on mobile */}
      <div className="bg-gray-900/50 border-b border-gray-800 overflow-x-auto">
        <div className="max-w-2xl mx-auto px-4 flex">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.key
                  ? 'text-emerald-400 border-emerald-400'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* ===== ACCESS CODES TAB ===== */}
        {activeTab === 'codes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold text-base">Access Codes</h2>
              <span className="text-xs text-gray-500">{codes.filter(c => c.active).length} active</span>
            </div>

            {/* Generate New Code */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
              <label className="block text-xs font-medium text-gray-400 mb-2">Generate New Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Label (e.g., John, Team A)"
                  className="flex-1 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500 min-w-0"
                />
                <button
                  onClick={generateNewCode}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-all flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Generate</span>
                </button>
              </div>
            </div>

            {/* Code List */}
            {codes.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <Key className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No access codes yet</p>
                <p className="text-xs mt-1">Generate one above to share with users</p>
              </div>
            ) : (
              <div className="space-y-2">
                {codes.map(c => (
                  <div key={c.code} className={`bg-gray-900/80 border rounded-xl p-4 transition-all ${
                    c.active ? 'border-gray-800' : 'border-red-500/20 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          c.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {c.active ? 'Active' : 'Blocked'}
                        </span>
                        <span className="text-white text-sm font-medium truncate">{c.label}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => copyToClipboard(c.code)} className="p-1.5 text-gray-500 hover:text-emerald-400 rounded-lg hover:bg-gray-800 transition-all">
                          {copied === c.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => toggleCode(c.code)} className="p-1.5 text-gray-500 hover:text-amber-400 rounded-lg hover:bg-gray-800 transition-all">
                          {c.active ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button onClick={() => deleteCode(c.code)} className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-emerald-400 font-mono text-sm tracking-wider bg-gray-800 px-3 py-1.5 rounded-lg flex-1 text-center">
                        {c.code}
                      </code>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-gray-600">
                      <span>Created: {new Date(c.createdAt).toLocaleDateString()}</span>
                      {c.lastUsed && <span>Last used: {new Date(c.lastUsed).toLocaleDateString()}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== API & PROXY TAB ===== */}
        {activeTab === 'api' && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold text-base">API & Proxy Settings</h2>

            {/* PHP Proxy URL */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-emerald-400" />
                <label className="text-sm font-medium text-gray-300">PHP Proxy URL</label>
              </div>
              <p className="text-gray-500 text-xs mb-3">The URL to your proxy.php file on cPanel</p>
              <input
                type="text"
                value={phpProxyUrl}
                onChange={(e) => setPhpProxyUrl(e.target.value)}
                placeholder="https://yourdomain.com/proxy.php"
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Residential Proxy API */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-cyan-400" />
                <label className="text-sm font-medium text-gray-300">Residential Proxy API</label>
              </div>
              <p className="text-gray-500 text-xs mb-3">Your proxy provider API credentials (if using API mode)</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">API URL</label>
                  <input
                    type="text"
                    value={proxyApiUrl}
                    onChange={(e) => setProxyApiUrl(e.target.value)}
                    placeholder="https://api.proxyprovider.com/v1"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">API Key</label>
                  <input
                    type="password"
                    value={proxyApiKey}
                    onChange={(e) => setProxyApiKey(e.target.value)}
                    placeholder="Your API key"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={saveApiSettings}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-all"
            >
              {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Settings</>}
            </button>
          </div>
        )}

        {/* ===== BOOKMARKS TAB ===== */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold text-base">Browser Shortcuts</h2>
              <button onClick={() => { setBookmarks(DEFAULT_BOOKMARKS); localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(DEFAULT_BOOKMARKS)); }}
                className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Add Bookmark */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
              <label className="block text-xs font-medium text-gray-400 mb-3">Add New Shortcut</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBmIcon}
                    onChange={(e) => setNewBmIcon(e.target.value)}
                    className="w-14 px-2 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-center text-lg focus:outline-none focus:border-emerald-500"
                    maxLength={2}
                  />
                  <input
                    type="text"
                    value={newBmName}
                    onChange={(e) => setNewBmName(e.target.value)}
                    placeholder="Name"
                    className="flex-1 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500 min-w-0"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBmUrl}
                    onChange={(e) => setNewBmUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500 min-w-0"
                  />
                  <button onClick={addBookmark} disabled={!newBmName || !newBmUrl}
                    className="px-4 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-40 transition-all flex-shrink-0">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bookmark List */}
            <div className="space-y-2">
              {bookmarks.map((bm, i) => (
                <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-xl p-3 flex items-center gap-3">
                  <span className="text-lg flex-shrink-0">{bm.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{bm.name}</p>
                    <p className="text-gray-500 text-xs truncate">{bm.url}</p>
                  </div>
                  <button onClick={() => removeBookmark(i)} className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-all flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={saveBookmarks}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-all"
            >
              {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Bookmarks</>}
            </button>
          </div>
        )}

        {/* ===== SETTINGS TAB ===== */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold text-base">System Settings</h2>

            {/* Admin Code Info */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-4 h-4 text-amber-400" />
                <label className="text-sm font-medium text-gray-300">Admin Access Code</label>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                <code className="text-amber-400 font-mono text-sm tracking-wider">ADMIN2024</code>
                <button onClick={() => copyToClipboard('ADMIN2024')} className="text-gray-500 hover:text-emerald-400 transition-all">
                  {copied === 'ADMIN2024' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-gray-600 text-[10px] mt-2">
                This is the master admin code. Use it to access this admin panel.
              </p>
            </div>

            {/* Stats */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-blue-400" />
                <label className="text-sm font-medium text-gray-300">System Stats</label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-white">{codes.length}</p>
                  <p className="text-xs text-gray-500">Total Codes</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{codes.filter(c => c.active).length}</p>
                  <p className="text-xs text-gray-500">Active Codes</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-400">{codes.filter(c => !c.active).length}</p>
                  <p className="text-xs text-gray-500">Blocked</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-cyan-400">{bookmarks.length}</p>
                  <p className="text-xs text-gray-500">Bookmarks</p>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <label className="text-sm font-medium text-red-400">Danger Zone</label>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => { if (confirm('Clear all profiles?')) { localStorage.removeItem('stealth_profiles'); alert('All profiles cleared'); } }}
                  className="w-full py-2.5 bg-gray-800 border border-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/10 transition-all"
                >
                  Clear All Profiles
                </button>
                <button
                  onClick={() => { if (confirm('Block ALL access codes?')) { saveCodes(codes.map(c => ({ ...c, active: false }))); } }}
                  className="w-full py-2.5 bg-gray-800 border border-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/10 transition-all"
                >
                  Block All Users
                </button>
                <button
                  onClick={() => { if (confirm('Reset EVERYTHING? This cannot be undone!')) { localStorage.clear(); window.location.reload(); } }}
                  className="w-full py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm font-semibold hover:bg-red-500/30 transition-all"
                >
                  Factory Reset (Clear All Data)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
