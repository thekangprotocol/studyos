import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { LandingPage } from './pages/LandingPage';
import { Onboarding } from './pages/Onboarding';
import { AdvisorChat } from './pages/AdvisorChat';
import { dbService } from './services/db.service';
import type { UserProfile } from './types';
import { Loader2 } from 'lucide-react';

/**
 * Main Content Router
 * Manages Auth state, Onboarding redirection, and Navigation between Today's Mission & Advisor Chat.
 */
const MainContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat'>('dashboard');

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfile(null);
      setProfileLoading(false);
    }
  }, [user]);

  const loadProfile = async () => {
    setProfileLoading(true);
    const userProfile = await dbService.getUserProfile();
    setProfile(userProfile);
    setProfileLoading(false);
  };

  // 1. Loading state
  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-center items-center text-zinc-400 gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase font-mono">Initializing StudyOS Chief of Staff...</p>
      </div>
    );
  }

  // 2. Unauthenticated state -> Landing Page
  if (!user) {
    return <LandingPage />;
  }

  // 3. Authenticated butOnboarding incomplete -> Onboarding Page
  if (profile && !profile.onboardingCompleted) {
    return <Onboarding onComplete={loadProfile} />;
  }

  // 4. Authenticated & Onboarded -> Main App View
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1">
        {activeTab === 'dashboard' ? <Dashboard /> : <AdvisorChat />}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
};

export default App;
