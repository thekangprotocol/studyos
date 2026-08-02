import React from 'react';
import { Container } from './Container';
import { formatTodayHeader } from '../utils/date';
import { Compass, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Reusable Header Component
 * Displays the StudyOS pitch black brand title, today's date, logged in user info, and sign out button.
 */
export const Header: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b border-zinc-900 bg-black/80 backdrop-blur-xl sticky top-0 z-40 py-4">
      <Container>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Compass className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Study<span className="text-indigo-400">OS</span>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-800/40">
                  MVP
                </span>
              </h1>
              <p className="text-[11px] text-zinc-400">AI Daily Priority Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                {formatTodayHeader()}
              </span>
            </div>

            {user && (
              <div className="flex items-center gap-3 pl-3 border-l border-zinc-900">
                <div className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="max-w-[140px] truncate font-medium">{user.email}</span>
                </div>
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
  );
};
