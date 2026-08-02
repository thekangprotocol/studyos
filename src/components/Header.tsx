import React, { useState } from 'react';
import { Container } from './Container';
import { formatTodayHeader } from '../utils/date';
import { Compass, LogOut, User, LayoutDashboard, MessageSquare, Settings, Calendar, CheckSquare, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AccountSettingsModal } from './AccountSettingsModal';

interface HeaderProps {
  activeTab?: 'dashboard' | 'tasks' | 'chat';
  setActiveTab?: (tab: 'dashboard' | 'tasks' | 'chat') => void;
}

/**
 * Reusable Header Component
 * Professional Monochrome Black & White styling with Dark/Light mode toggle.
 */
export const Header: React.FC<HeaderProps> = ({ activeTab = 'dashboard', setActiveTab }) => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="border-b border-zinc-200 dark:border-zinc-900 bg-white/90 dark:bg-black/90 backdrop-blur-xl sticky top-0 z-40 py-3.5 transition-colors">
        <Container>
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="p-2 bg-black text-white dark:bg-white dark:text-black rounded-xl shadow-sm transition-colors">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-black dark:text-white flex items-center gap-2">
                  Study<span className="text-zinc-500 dark:text-zinc-400">OS</span>
                  <span className="text-[10px] bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-300 font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-zinc-300 dark:border-zinc-800">
                    Chief of Staff
                  </span>
                </h1>
              </div>
            </div>

            {/* Center Navigation Tabs */}
            {user && setActiveTab && (
              <div className="flex bg-zinc-100 dark:bg-zinc-900/80 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shrink-0">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'dashboard'
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-md'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Today's Mission</span>
                </button>

                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'tasks'
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-md'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>All Tasks</span>
                </button>

                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'chat'
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-md'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chief of Staff Chat</span>
                </button>
              </div>
            )}

            {/* Right Side: Theme Toggle, Date & User Menu */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-all shadow-sm"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-900" />}
              </button>

              {/* Unsquished Date Badge */}
              <div className="hidden lg:flex items-center shrink-0">
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900/90 px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 whitespace-nowrap shadow-sm">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>{formatTodayHeader()}</span>
                </span>
              </div>

              {user && (
                <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-900/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors"
                    title="Account Settings"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline max-w-[120px] truncate">{user.email}</span>
                    <Settings className="w-3.5 h-3.5 text-zinc-400 ml-0.5" />
                  </button>

                  <button
                    onClick={() => signOut()}
                    title="Log Out"
                    className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900/40"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </Container>
      </header>

      {/* Account Settings Modal */}
      <AccountSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};
