import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { LandingPage } from './pages/LandingPage';
import { Onboarding } from './pages/Onboarding';
import { AdvisorChat } from './pages/AdvisorChat';
import { TasksPage } from './pages/TasksPage';
import { dbService } from './services/db.service';
import type { UserProfile } from './types';
import { Loader2 } from 'lucide-react';

/**
 * Main Content Router
 * Manages Auth state, Onboarding redirection, Theme, and Navigation between Today's Mission, All Tasks & Advisor Chat.
 */
const MainContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'chat'>('dashboard');

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
        <Loader2 className="w-8 h-8 text-white animate-spin" />
        <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase font-mono">Initializing StudyOS Chief of Staff...</p>
      </div>
    );
  }

  // 2. Unauthenticated state -> Landing Page
  if (!user) {
    return <LandingPage />;
  }

  // 3. Authenticated but Onboarding incomplete -> Onboarding Page
  if (profile && !profile.onboardingCompleted) {
    return <Onboarding onComplete={loadProfile} />;
  }

  // 4. Authenticated & Onboarded -> Main App View
  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'tasks' && <TasksPage />}
        {activeTab === 'chat' && <AdvisorChat />}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
