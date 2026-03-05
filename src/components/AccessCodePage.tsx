import { useState } from 'react';
import { Shield, ArrowRight, Loader2, AlertCircle, Lock } from 'lucide-react';

interface AccessCodePageProps {
  onVerify: (isAdmin: boolean) => void;
}

const ACCESS_CODES_KEY = 'stealth_access_codes';
const ADMIN_CODE = 'ADMIN2024';

export default function AccessCodePage({ onVerify }: AccessCodePageProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError('');

    // Simulate verification delay
    await new Promise(r => setTimeout(r, 800));

    const trimmed = code.trim().toUpperCase();

    // Check admin code
    if (trimmed === ADMIN_CODE) {
      setLoading(false);
      onVerify(true);
      return;
    }

    // Check access codes from storage
    try {
      const stored = localStorage.getItem(ACCESS_CODES_KEY);
      const codes = stored ? JSON.parse(stored) : [];
      const found = codes.find((c: any) => c.code === trimmed && c.active);

      if (found) {
        // Update last used
        const updated = codes.map((c: any) =>
          c.code === trimmed ? { ...c, lastUsed: new Date().toISOString() } : c
        );
        localStorage.setItem(ACCESS_CODES_KEY, JSON.stringify(updated));
        setLoading(false);
        onVerify(false);
        return;
      }
    } catch {
      // ignore
    }

    setLoading(false);
    setError('Invalid or expired access code');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-emerald-500/20">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">StealthBrowser</h1>
          <p className="text-gray-500 text-sm">Anti-Detect Browser System</p>
        </div>

        {/* Access Code Form */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Enter Access Code</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
                placeholder="Enter your access code"
                className="w-full px-4 py-3.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-center text-lg tracking-[0.3em] font-mono placeholder-gray-600 placeholder:tracking-normal placeholder:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
              ) : (
                <>Verify & Enter <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-gray-600 text-[10px] text-center mt-4">
            Contact administrator for access code
          </p>
        </div>

        <p className="text-gray-700 text-[10px] text-center mt-4">
          StealthBrowser v3.0 — Secure Anti-Detect System
        </p>
      </div>
    </div>
  );
}
