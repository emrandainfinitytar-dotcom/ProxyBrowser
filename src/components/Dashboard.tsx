import { useState } from 'react';
import {
  Plus, Play, Trash2, Copy, Search,
  Shield, Wifi, Smartphone, Clock,
  MoreVertical, LogOut, Settings
} from 'lucide-react';
import type { BrowserProfile } from '../types';

interface DashboardProps {
  profiles: BrowserProfile[];
  onCreateNew: () => void;
  onLaunch: (profile: BrowserProfile) => void;
  onDelete: (id: string) => void;
  onDuplicate: (profile: BrowserProfile) => void;
  onLogout: () => void;
  isAdmin: boolean;
  onAdminPanel: () => void;
}

export default function Dashboard({
  profiles, onCreateNew, onLaunch, onDelete, onDuplicate, onLogout, isAdmin, onAdminPanel
}: DashboardProps) {
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered = profiles.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const running = profiles.filter(p => p.status === 'running').length;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-white font-bold text-sm">StealthBrowser</h1>
                <p className="text-gray-500 text-[10px]">Anti-Detect System</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {isAdmin && (
                <button onClick={onAdminPanel}
                  className="p-2 text-amber-400 hover:bg-gray-800 rounded-lg transition-all" title="Admin Panel">
                  <Settings className="w-4 h-4" />
                </button>
              )}
              <button onClick={onLogout}
                className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-all" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4">
        {/* Stats - Compact for mobile */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-white">{profiles.length}</p>
            <p className="text-[10px] text-gray-500">Profiles</p>
          </div>
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-emerald-400">{running}</p>
            <p className="text-[10px] text-gray-500">Running</p>
          </div>
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-cyan-400">{profiles.filter(p => p.proxy.host).length}</p>
            <p className="text-[10px] text-gray-500">Proxied</p>
          </div>
        </div>

        {/* Search + Create */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search profiles..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={onCreateNew}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-cyan-600 transition-all text-sm flex-shrink-0 shadow-lg shadow-emerald-500/10"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Profile</span>
          </button>
        </div>

        {/* Profile List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-900 flex items-center justify-center">
              <Shield className="w-8 h-8 text-gray-700" />
            </div>
            <h3 className="text-gray-400 font-medium mb-1">
              {profiles.length === 0 ? 'No profiles yet' : 'No matches'}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {profiles.length === 0 ? 'Create your first browser profile' : 'Try a different search'}
            </p>
            {profiles.length === 0 && (
              <button onClick={onCreateNew}
                className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-all">
                Create First Profile
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(profile => (
              <div
                key={profile.id}
                className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    profile.status === 'running' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'
                  }`} />

                  {/* Profile Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm truncate">{profile.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      {profile.proxy.host && (
                        <span className="text-gray-500 text-[10px] flex items-center gap-1">
                          <Wifi className="w-2.5 h-2.5" />
                          {profile.proxy.host}:{profile.proxy.port}
                        </span>
                      )}
                      {profile.userAgent.brand && (
                        <span className="text-gray-500 text-[10px] flex items-center gap-1">
                          <Smartphone className="w-2.5 h-2.5" />
                          {profile.userAgent.brand} {profile.userAgent.model}
                        </span>
                      )}
                      <span className="text-gray-600 text-[10px] flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onLaunch(profile)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all text-xs font-medium"
                    >
                      <Play className="w-3 h-3" />
                      <span className="hidden sm:inline">Launch</span>
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === profile.id ? null : profile.id)}
                        className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenu === profile.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                          <div className="absolute right-0 top-full mt-1 w-40 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                            <button
                              onClick={() => { onDuplicate(profile); setOpenMenu(null); }}
                              className="w-full flex items-center gap-2 px-4 py-3 text-gray-300 hover:bg-gray-700 transition-all text-sm"
                            >
                              <Copy className="w-3.5 h-3.5" /> Duplicate
                            </button>
                            <button
                              onClick={() => { onDelete(profile.id); setOpenMenu(null); }}
                              className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-gray-700 transition-all text-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
