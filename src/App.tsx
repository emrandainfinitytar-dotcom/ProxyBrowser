import { useState, useEffect } from 'react';
import type { AppPage, BrowserProfile } from './types';
import AccessCodePage from './components/AccessCodePage';
import Dashboard from './components/Dashboard';
import ProfileWizard from './components/ProfileWizard';
import BrowserView from './components/BrowserView';
import AdminDashboard from './components/AdminDashboard';

const STORAGE_KEY = 'stealth_profiles';
const AUTH_KEY = 'stealth_auth';
const ADMIN_KEY = 'stealth_is_admin';

function loadProfiles(): BrowserProfile[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveProfiles(profiles: BrowserProfile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export default function App() {
  const [page, setPage] = useState<AppPage>(() => {
    return localStorage.getItem(AUTH_KEY) === 'true' ? 'dashboard' : 'access';
  });
  const [profiles, setProfiles] = useState<BrowserProfile[]>(loadProfiles);
  const [activeProfile, setActiveProfile] = useState<BrowserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem(ADMIN_KEY) === 'true');

  useEffect(() => {
    saveProfiles(profiles);
  }, [profiles]);

  const handleVerify = (admin: boolean) => {
    localStorage.setItem(AUTH_KEY, 'true');
    localStorage.setItem(ADMIN_KEY, admin ? 'true' : 'false');
    setIsAdmin(admin);
    setPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(ADMIN_KEY);
    setIsAdmin(false);
    setPage('access');
  };

  const handleCreateProfile = (profile: BrowserProfile) => {
    setProfiles(prev => [profile, ...prev]);
    setPage('dashboard');
  };

  const handleDeleteProfile = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
  };

  const handleDuplicateProfile = (profile: BrowserProfile) => {
    const duplicate: BrowserProfile = {
      ...profile,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      name: `${profile.name} (Copy)`,
      createdAt: new Date().toISOString(),
      status: 'ready',
    };
    setProfiles(prev => [duplicate, ...prev]);
  };

  const handleLaunchProfile = (profile: BrowserProfile) => {
    setProfiles(prev => prev.map(p =>
      p.id === profile.id ? { ...p, status: 'running' as const } : p
    ));
    setActiveProfile(profile);
    setPage('browser');
  };

  const handleBackFromBrowser = () => {
    if (activeProfile) {
      setProfiles(prev => prev.map(p =>
        p.id === activeProfile.id ? { ...p, status: 'ready' as const } : p
      ));
    }
    setActiveProfile(null);
    setPage('dashboard');
  };

  const renderDashboard = () => (
    <Dashboard
      profiles={profiles}
      onCreateNew={() => setPage('wizard')}
      onLaunch={handleLaunchProfile}
      onDelete={handleDeleteProfile}
      onDuplicate={handleDuplicateProfile}
      onLogout={handleLogout}
      isAdmin={isAdmin}
      onAdminPanel={() => setPage('admin')}
    />
  );

  switch (page) {
    case 'access':
      return <AccessCodePage onVerify={handleVerify} />;
    case 'dashboard':
      return renderDashboard();
    case 'admin':
      return <AdminDashboard onBack={() => setPage('dashboard')} />;
    case 'wizard':
      return (
        <ProfileWizard
          onComplete={handleCreateProfile}
          onCancel={() => setPage('dashboard')}
        />
      );
    case 'browser':
      return activeProfile ? (
        <BrowserView
          profile={activeProfile}
          onBack={handleBackFromBrowser}
        />
      ) : renderDashboard();
  }
}
