import React from 'react';
import { OnboardingChat } from '../components/OnboardingChat';
import { Compass } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full z-10 space-y-8 text-center">
        {/* Header Branding */}
        <div className="space-y-4">
          <div className="inline-flex p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 mb-2">
            <Compass className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Let's build your <span className="text-indigo-400">StudyOS.</span>
          </h1>
          <p className="text-base sm:text-xl text-zinc-400 max-w-lg mx-auto font-normal leading-relaxed">
            I'm going to learn about your school life so I can decide what you should study every day.
          </p>
        </div>

        {/* Interactive Onboarding Chat */}
        <OnboardingChat onComplete={onComplete} />

        <p className="text-xs text-zinc-600">
          StudyOS AI Academic Chief of Staff • Confidential & Secure
        </p>
      </div>
    </div>
  );
};
