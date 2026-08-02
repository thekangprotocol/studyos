import React, { useState } from 'react';
import { Container } from './Container';
import { formatTodayHeader } from '../utils/date';
import { Compass, LogOut, User, LayoutDashboard, MessageSquare, Settings, Calendar, CheckSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AccountSettingsModal } from './AccountSettingsModal';

interface HeaderProps {
  activeTab?: 'dashboard' | 'tasks' | 'chat';
  setActiveTab?: (tab: 'dashboard' | 'tasks' | 'chat') => void;
}

/**
 * Reusable Header Component
 * Displays StudyOS pitch black brand title, navigation tabs (Today's Mission vs All Tasks vs Chief of Staff Chat), settings, and user logout.
 */
export const Header: React.FC<HeaderProps> = ({ activeTab = 'dashboard', setActiveTab }) => {
  const { user, signOut } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="border-b border-zinc-900 bg-black/90 backdrop-blur-xl sticky top-0 z-40 py-3.5">
        <Container>
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <Compass className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Study<span className="text-indigo-400">OS</span>
                  <span className="text-[10px] bg-indigo-950 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-800/40">
                    Chief of Staff
                  </span>
                </h1>
              </div>
            </div>

            {/* Center Navigation Tabs */}
            {user && setActiveTab && (
              <div className="flex bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 shrink-0">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'dashboard'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Today's Mission</span>
                </button>

                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'tasks'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>All Tasks</span>
                </button>

                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'chat'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chief of Staff Chat</span>
                </button>
              </div>
            )}

            {/* Right Side: Unsquished Date & Account Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden lg:flex items-center shrink-0">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-zinc-900/90 px-3.5 py-1.5 rounded-xl border border-zinc-800 whitespace-nowrap shadow-sm">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{formatTodayHeader()}</span>
                </span>
              </div>

              {user && (
                <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-800 transition-colors"
                    title="Account Settings"
                  >
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline max-w-[120px] truncate font-medium">{user.email}</span>
                    <Settings className="w-3.5 h-3.5 text-zinc-400 ml-0.5" />
                  </button>

                  <button
                    onClick={() => signOut()}
                    title="Log Out"
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors border border-transparent hover:border-red-900/40"
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
