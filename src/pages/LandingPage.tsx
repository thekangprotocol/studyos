import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Brain,
  Zap,
  Target,
  BarChart3,
  ChevronDown,
  Mail,
  Lock,
  User as UserIcon,
  Loader2,
  AlertCircle,
  X,
  Play,
  Clock,
  BookOpen,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { signIn, signUp } = useAuth();

  // Auth modal state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Status feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // FAQ open states
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const openAuthModal = (signUpMode: boolean = false) => {
    setIsSignUp(signUpMode);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsAuthOpen(true);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (isSignUp && password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setAuthLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Account created successfully! Redirecting...');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMsg(error.message);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('An unexpected authentication error occurred.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const faqs = [
    {
      q: 'How does StudyOS decide what I should study?',
      a: 'StudyOS analyzes your course list, upcoming exam dates, task difficulty, and available study hours for today to construct an optimized daily schedule eliminating decision fatigue.',
    },
    {
      q: 'Is StudyOS free for students?',
      a: 'Yes, StudyOS MVP is completely free to use. Create an account and start managing your daily study flow in seconds.',
    },
    {
      q: 'How is StudyOS different from standard task management apps?',
      a: 'Standard to-do lists just show you a pile of deadlines. StudyOS actively prioritizes what matters right now based on your energy and exam proximity so you never feel overwhelmed.',
    },
    {
      q: 'Can I customize my daily study hours?',
      a: 'Absolutely. You control how many hours you want to dedicate each day, and StudyOS automatically sizes your tasks to fit perfectly into your schedule.',
    },
  ];

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-96 -left-40 w-96 h-96 bg-blue-600/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 blur-3xl rounded-full pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-900 bg-black/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Compass className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Study<span className="text-indigo-400">OS</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-400">
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How it Works
            </a>
            <a href="#benefits" className="hover:text-white transition-colors">
              Benefits
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => openAuthModal(false)}
              className="text-xs font-medium text-zinc-300 hover:text-white px-3 py-2 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => openAuthModal(true)}
              className="text-xs font-semibold bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-indigo-500/10"
            >
              Start Free
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-24 pb-20 px-6 max-w-5xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium mb-8 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>AI Daily Priority Assistant for Students</span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1] mb-6">
          Stop wondering <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-white bg-clip-text text-transparent">
            what to study.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed mb-10">
          StudyOS uses AI to decide exactly what you should work on today so you can stop procrastinating and start making progress.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={() => openAuthModal(true)}
            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Start Free</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-sm font-semibold rounded-xl border border-zinc-800 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
            <span>See Demo</span>
          </a>
        </div>

        {/* Linear App Interactive Mock Preview */}
        <div className="relative max-w-3xl mx-auto rounded-2xl p-1 bg-gradient-to-b from-zinc-800/60 via-zinc-900/40 to-black shadow-2xl border border-zinc-800 backdrop-blur-xl">
          <div className="bg-black/90 rounded-[14px] p-6 sm:p-8 text-left border border-zinc-800/80">
            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs text-zinc-500 font-mono ml-2">Today's Priority Matrix</span>
              </div>
              <span className="text-xs font-semibold text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-md border border-indigo-800/40">
                AI Schedule Active
              </span>
            </div>

            {/* Content Preview */}
            <div className="space-y-4">
              <div className="p-4 bg-zinc-900/90 rounded-xl border border-indigo-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">CS 101: Review Binary Trees & Recursion</h4>
                    <p className="text-xs text-zinc-400">High priority • Exam in 3 days</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>45 mins</span>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/40 rounded-xl border border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-zinc-600" />
                  <div>
                    <h4 className="text-sm font-medium text-zinc-300">MATH 202: Problem Set 4 (Odd Numbers)</h4>
                    <p className="text-xs text-zinc-500">Medium priority • Due Thursday</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500 bg-black px-2.5 py-1 rounded-lg border border-zinc-900">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>60 mins</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-24 px-6 max-w-5xl mx-auto border-t border-zinc-900">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-2">Workflow</p>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Three simple steps to clarity.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-2xl hover:border-indigo-500/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-indigo-400 font-semibold uppercase tracking-wider">Step 01</span>
            <h3 className="text-xl font-bold text-white mt-2 mb-3">Add Your Work</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Input your active courses, assignments, and upcoming exam dates in seconds.
            </p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-2xl hover:border-indigo-500/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
              <Brain className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-indigo-400 font-semibold uppercase tracking-wider">Step 02</span>
            <h3 className="text-xl font-bold text-white mt-2 mb-3">AI Prioritizes</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              StudyOS analyzes deadline urgency, course difficulty, and your daily energy level.
            </p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-2xl hover:border-indigo-500/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-indigo-400 font-semibold uppercase tracking-wider">Step 03</span>
            <h3 className="text-xl font-bold text-white mt-2 mb-3">Execute & Win</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Follow your structured daily plan without second-guessing where to start.
            </p>
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section id="benefits" className="py-24 px-6 max-w-5xl mx-auto border-t border-zinc-900">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-2">Designed for focus</p>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Built for overwhelmed minds.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900/50 border border-zinc-800/80 p-8 rounded-2xl backdrop-blur-xl">
            <Target className="w-8 h-8 text-indigo-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Zero Decision Fatigue</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Stop wasting 30 minutes every study session staring at your desk wondering what to work on first.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/80 p-8 rounded-2xl backdrop-blur-xl">
            <BarChart3 className="w-8 h-8 text-indigo-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Maximized Study ROI</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Allocate your time where it impacts your GPA the most, protecting you from last-minute exam panics.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/80 p-8 rounded-2xl backdrop-blur-xl">
            <Clock className="w-8 h-8 text-indigo-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Fits Your Schedule</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Whether you have 1 hour or 6 hours today, StudyOS adjusts your workload to fit your exact availability.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/80 p-8 rounded-2xl backdrop-blur-xl">
            <Sparkles className="w-8 h-8 text-indigo-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Smarter Daily Streaks</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Maintain consistent momentum without burnout through bite-sized, realistic daily targets.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-24 px-6 max-w-3xl mx-auto border-t border-zinc-900">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-2">Questions</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between text-white font-semibold text-base hover:text-indigo-400 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-zinc-500 transition-transform ${
                    openFaq === idx ? 'rotate-180 text-indigo-400' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/80 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 px-6 max-w-5xl mx-auto border-t border-zinc-900 text-center">
        <div className="bg-gradient-to-b from-zinc-900 via-black to-black border border-zinc-800 p-12 sm:p-16 rounded-3xl backdrop-blur-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-6">
            Ready to conquer your study sessions?
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto mb-8">
            Join students who stopped procrastinating and started achieving absolute daily clarity.
          </p>

          <button
            onClick={() => openAuthModal(true)}
            className="px-8 py-4 bg-white hover:bg-zinc-200 text-black font-semibold text-sm rounded-xl shadow-xl transition-all inline-flex items-center gap-2"
          >
            <span>Start Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-zinc-900 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} StudyOS. All rights reserved. Designed for minimal focus.
      </footer>

      {/* AUTH MODAL */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 sm:p-8 relative shadow-2xl">
            <button
              onClick={() => setIsAuthOpen(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 mb-3">
                <Compass className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {isSignUp ? 'Create your StudyOS Account' : 'Welcome back'}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                {isSignUp ? 'Get started for free in seconds' : 'Sign in to access your dashboard'}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-black p-1 rounded-xl mb-6 border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  !isSignUp ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  isSignUp ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Alerts */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Morgan"
                      className="w-full pl-9 pr-4 py-2.5 bg-black border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full pl-9 pr-4 py-2.5 bg-black border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 bg-black border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
