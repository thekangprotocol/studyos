import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db.service';
import { useAuth } from '../context/AuthContext';
import type { UserProfile } from '../types';
import { X, User, Trash2, AlertTriangle, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProfile();
      setShowDeleteConfirm(false);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  const loadProfile = async () => {
    setLoading(true);
    const p = await dbService.getUserProfile();
    setProfile(p);
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);

    try {
      await dbService.deleteUserAccount();
      await signOut();
      onClose();
    } catch (err) {
      console.error('Error deleting account:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleResetOnboarding = async () => {
    if (!user) return;
    localStorage.removeItem(`onboarding_completed_${user.id}`);
    await dbService.updateUserProfile({ onboardingCompleted: false });
    setSuccessMsg('Onboarding status reset. Refreshing page...');
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-black dark:text-white relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="p-2.5 bg-black text-white dark:bg-white dark:text-black rounded-2xl shadow-sm">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight font-heading">Account Settings</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Manage your profile, academic memory, & account data</p>
          </div>
        </div>

        {/* Profile Info */}
        {loading ? (
          <div className="py-8 text-center text-zinc-500">
            <Loader2 className="w-6 h-6 animate-spin text-black dark:text-white mx-auto mb-2" />
            <p className="text-xs font-semibold">Loading profile settings...</p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {successMsg && (
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-black dark:text-white font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 bg-zinc-50 dark:bg-black p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <div>
                <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] font-bold block">Email</span>
                <span className="font-bold text-black dark:text-white truncate block">{user?.email}</span>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] font-bold block">Year / Grade</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{profile?.gradeLevel || 'Not set'}</span>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] font-bold block">School</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{profile?.schoolName || 'Not set'}</span>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] font-bold block">Daily Hours</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{profile?.dailyAvailableHours || 3} hours/day</span>
              </div>
            </div>

            {/* Re-take Onboarding Action */}
            <div className="pt-2">
              <button
                onClick={handleResetOnboarding}
                className="w-full py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white font-bold rounded-xl text-xs transition-colors border border-zinc-200 dark:border-zinc-700 text-center"
              >
                Re-take Onboarding Chat & Reset Memories
              </button>
            </div>

            {/* DANGER ZONE: DELETE ACCOUNT */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5 space-y-3">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>Danger Zone</span>
              </div>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Account & Erase All Data</span>
                </button>
              ) : (
                <div className="p-4 bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800/80 rounded-2xl space-y-3 text-red-900 dark:text-red-200 text-xs">
                  <div className="flex items-center gap-2 font-bold text-red-700 dark:text-red-300">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>Are you absolutely sure?</span>
                  </div>
                  <p className="text-[11px] leading-relaxed font-medium">
                    This action is permanent and cannot be undone. All your courses, tasks, exams, academic memories, and study plans will be permanently erased.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                      className="flex-1 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white font-bold rounded-lg transition-colors text-center"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <span>Yes, Delete Everything</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
