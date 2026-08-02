import React from 'react';
import { Container } from './Container';
import { formatTodayHeader } from '../utils/date';
import { Compass, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Reusable Header Component
 * Displays the StudyOS brand title, today's date, logged in user info, and sign out button.
 */
export const Header: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10 py-4">
      <Container>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Compass className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
                StudyOS
                <span className="text-xs bg-indigo-500/20 text-indigo-300 font-medium px-2 py-0.5 rounded-full border border-indigo-500/30">
                  MVP
                </span>
              </h1>
              <p className="text-xs text-slate-400">AI Daily Priority Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-3 py-1.5 rounded-lg border border-indigo-800/40">
                {formatTodayHeader()}
              </span>
            </div>

            {user && (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="max-w-[140px] truncate font-medium">{user.email}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  title="Log Out"
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors border border-transparent hover:border-red-900/40"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
};
