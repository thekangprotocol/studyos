import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { LandingPage } from './pages/LandingPage';
import { Loader2 } from 'lucide-react';

/**
 * Main Application Content Router
 * Protects the Dashboard view and redirects unauthenticated users to the Landing Page.
 */
const MainContent: React.FC = () => {
  const { user, loading } = useAuth();

  // 1. Show clean loading state while fetching session persistence
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Loading StudyOS...</p>
      </div>
    );
  }

  // 2. Unauthenticated state -> Landing Page (Sign In / Sign Up)
  if (!user) {
    return <LandingPage />;
  }

  // 3. Authenticated state -> Protected Dashboard
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Header />
      <div className="flex-1">
        <Dashboard />
      </div>
    </div>
  );
};

/**
 * Root Application Component
 * Wraps the app in Supabase Auth Provider.
 */
export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
};

export default App;
