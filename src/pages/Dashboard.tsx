import React, { useState, useEffect } from 'react';
import { Container } from '../components/Container';
import { useStudyPlan } from '../hooks/useStudyPlan';
import { useAuth } from '../context/AuthContext';
import { formatTodayHeader, formatMinutes } from '../utils/date';
import type { StudyTask, TimelineBlock } from '../types';
import { TaskInputForm } from '../components/TaskInputForm';
import {
  Sparkles,
  Clock,
  Target,
  CheckCircle2,
  Circle,
  RefreshCw,
  Loader2,
  Sliders,
  Zap,
  PlusCircle,
  X,
  Cpu,
  ShieldCheck,
  BrainCircuit,
  Calendar,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { plan, loading, error, successNotification, generatePlan, dismissSuccess } = useStudyPlan();

  // Local interactive state for task & timeline completion
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [timeline, setTimeline] = useState<TimelineBlock[]>([]);

  // Generator Options Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  const [availableMinutes, setAvailableMinutes] = useState(120);
  const [energyLevel, setEnergyLevel] = useState<'low' | 'medium' | 'high'>('high');

  // Load initial plan automatically if not present
  useEffect(() => {
    if (!plan && !loading) {
      generatePlan({
        availableMinutes: 120,
        energyLevel: 'high',
        upcomingExams: [{ subjectName: 'Calculus II', daysLeft: 3 }],
      });
    }
  }, [plan, loading, generatePlan]);

  // Sync plan into local state for checkbox toggling
  useEffect(() => {
    if (plan) {
      setTasks(plan.recommendedTasks);
      setTimeline(plan.timeline);
    }
  }, [plan]);

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const toggleTimeline = (blockId: string) => {
    setTimeline((prev) =>
      prev.map((tb) => (tb.id === blockId ? { ...tb, completed: !tb.completed } : tb))
    );
  };

  const handleGenerateTodayPlan = () => {
    setShowConfigModal(false);
    generatePlan({
      availableMinutes,
      energyLevel,
      upcomingExams: [{ subjectName: 'Calculus II', daysLeft: 3 }],
    });
  };

  const handleTaskSaved = () => {
    setShowTaskForm(false);
    generatePlan({
      availableMinutes,
      energyLevel,
      upcomingExams: [{ subjectName: 'Calculus II', daysLeft: 3 }],
    });
  };

  const getUserName = () => {
    if (!user) return 'Student';
    const fullName = user.user_metadata?.full_name;
    if (fullName) return fullName.split(' ')[0];
    if (user.email) return user.email.split('@')[0];
    return 'Student';
  };

  const getPriorityBadge = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === 'high' || p === 'urgent') {
      return (
        <span className="text-[10px] font-bold uppercase tracking-wider bg-red-950/60 text-red-300 px-2.5 py-0.5 rounded-full border border-red-800/50 shadow-sm">
          High
        </span>
      );
    }
    if (p === 'medium') {
      return (
        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-950/60 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-800/50 shadow-sm">
          Medium
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950/60 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-800/50 shadow-sm">
        Low
      </span>
    );
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <main className="py-10 sm:py-16 pb-24 text-zinc-100 selection:bg-indigo-500 selection:text-white bg-black">
      <Container>
        <div className="max-w-3xl mx-auto space-y-12">
          {/* SUCCESS NOTIFICATION TOAST */}
          {successNotification && (
            <div className="p-4 bg-emerald-950/80 border border-emerald-800/80 rounded-2xl text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-xl">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{successNotification}</span>
              </div>
              <button
                onClick={dismissSuccess}
                className="text-emerald-400 hover:text-emerald-200 p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* GREETING SECTION */}
          <section className="space-y-4 text-left border-b border-zinc-900 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-indigo-400 text-xs font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{formatTodayHeader()}</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                  Good day, {getUserName()}.
                </h1>
                <p className="text-zinc-400 text-base sm:text-lg">
                  Here is your focused study mission for today. No overthinking. Just execution.
                </p>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                <button
                  onClick={() => setShowTaskForm(true)}
                  disabled={loading}
                  className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusCircle className="w-4 h-4 text-indigo-400" />
                  <span>Add Task</span>
                </button>

                <button
                  onClick={handleGenerateTodayPlan}
                  disabled={loading}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-white" />
                  )}
                  <span>{loading ? 'Generating...' : "Generate Today's Plan"}</span>
                </button>
              </div>
            </div>
          </section>

          {/* TASK INPUT FORM */}
          {showTaskForm && (
            <div className="animate-in fade-in duration-200">
              <TaskInputForm
                onTaskSaved={handleTaskSaved}
                onCancel={() => setShowTaskForm(false)}
              />
            </div>
          )}

          {/* LOADING ANIMATION CARD */}
          {loading && (
            <div className="bg-zinc-900/80 border border-indigo-500/30 rounded-3xl p-12 text-center space-y-5 backdrop-blur-xl shadow-2xl animate-pulse">
              <div className="relative inline-block">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Querying AI Chief of Staff Engine...</h3>
                <p className="text-xs text-zinc-400">
                  Synthesizing academic memory • Calculating deadline priority • Generating today's schedule
                </p>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {error && (
            <div className="bg-red-950/40 border border-red-800/50 rounded-2xl p-4 text-center text-red-300 text-sm">
              {error}
            </div>
          )}

          {plan && !loading && (
            <>
              {/* 1. TODAY'S MISSION CARD */}
              <section className="relative overflow-hidden bg-gradient-to-b from-zinc-900 via-black to-black border border-zinc-800/80 rounded-3xl p-8 sm:p-10 backdrop-blur-2xl shadow-xl shadow-black/80 space-y-6">
                <div className="flex items-center justify-between gap-4 border-b border-zinc-900 pb-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    <Target className="w-4 h-4 text-indigo-400" />
                    <span>Today's Primary Mission</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{formatMinutes(plan.totalEstimatedMinutes)} target</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-indigo-300 uppercase tracking-widest bg-indigo-950 px-2.5 py-1 rounded-md border border-indigo-800/40">
                    {plan.focusSubject}
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-snug">
                    {plan.missionTitle}
                  </h2>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs text-zinc-400">
                  <span>
                    Status:{' '}
                    <strong className="text-indigo-300 font-medium">
                      {completedCount === tasks.length && tasks.length > 0
                        ? 'Mission Complete 🎉'
                        : `${completedCount} of ${tasks.length} Completed`}
                    </strong>
                  </span>
                  <button
                    onClick={() => setShowConfigModal(true)}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tailor Hours & Energy</span>
                  </button>
                </div>
              </section>

              {/* 2. TOP 3 PRIORITY CARDS */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Top 3 Priorities
                  </h3>
                  <span className="text-xs text-zinc-500 font-mono">
                    Focus Mode Active
                  </span>
                </div>

                <div className="space-y-4">
                  {tasks.slice(0, 3).map((task, idx) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`cursor-pointer p-6 rounded-2xl border transition-all flex items-start gap-4 shadow-md ${
                        task.completed
                          ? 'bg-black/40 border-zinc-900 opacity-60'
                          : 'bg-zinc-900/60 border-zinc-800 hover:border-indigo-500/40 backdrop-blur-xl shadow-black/60'
                      }`}
                    >
                      <button className="mt-1 shrink-0 text-zinc-500 hover:text-indigo-400 transition-colors">
                        {task.completed ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <Circle className="w-6 h-6 text-zinc-600" />
                        )}
                      </button>

                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                            Priority 0{idx + 1}
                          </span>
                          <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-800/40">
                            {task.subjectName}
                          </span>
                          {getPriorityBadge(task.priority)}
                        </div>

                        <h4
                          className={`text-base font-semibold text-zinc-100 leading-snug ${
                            task.completed ? 'line-through text-zinc-500' : ''
                          }`}
                        >
                          {task.title}
                        </h4>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-1 text-zinc-400 font-mono text-xs bg-black px-2.5 py-1 rounded-lg border border-zinc-800">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{task.estimatedMinutes}m</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 3. TIMELINE CARDS */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Study Schedule & Timeline
                  </h3>
                  <span className="text-xs text-zinc-500 font-mono">Today</span>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-md shadow-black/50">
                  {timeline.map((block, idx) => (
                    <div
                      key={block.id}
                      onClick={() => toggleTimeline(block.id)}
                      className="cursor-pointer flex items-start gap-4 relative group"
                    >
                      {/* Vertical connector line */}
                      {idx !== timeline.length - 1 && (
                        <div className="absolute left-[11px] top-7 bottom-0 w-[2px] bg-zinc-800 group-hover:bg-indigo-500/20 transition-colors" />
                      )}

                      <button className="mt-0.5 shrink-0 z-10 bg-black rounded-full">
                        {block.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-indigo-400/60 group-hover:text-indigo-400" />
                        )}
                      </button>

                      <div className="flex-1 space-y-1 bg-black/60 p-4 rounded-xl border border-zinc-800/60 group-hover:border-indigo-500/30 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-semibold text-indigo-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {block.timeRange}
                          </span>
                          <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 font-medium">
                            {block.subjectName}
                          </span>
                        </div>
                        <p
                          className={`text-sm font-medium text-zinc-200 ${
                            block.completed ? 'line-through text-zinc-500' : ''
                          }`}
                        >
                          {block.activity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 4. EXPLICIT AI REASONING & PROOF VERIFICATION CARD */}
              <section className="space-y-4">
                <div className="bg-gradient-to-b from-zinc-900/90 to-black border border-indigo-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-xl space-y-4 shadow-lg shadow-black/80">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                      <BrainCircuit className="w-4.5 h-4.5 text-indigo-400" />
                      <span>AI Engine Decision & Reasoning Proof</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-[10px] font-semibold">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        AI Verified
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-[10px] font-semibold">
                        <Cpu className="w-3 h-3 text-indigo-400" />
                        Gemini 2.0 / Chief Engine
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-200 leading-relaxed font-medium">
                    {plan.reasoning}
                  </p>

                  <div className="pt-2 border-t border-zinc-900 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                    <span className="font-semibold text-zinc-500">Active Inputs:</span>
                    <span className="bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800 text-zinc-300 font-mono">Academic Memory Loaded</span>
                    <span className="bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800 text-zinc-300 font-mono">GPA Optimization Active</span>
                    <span className="bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800 text-zinc-300 font-mono">Stress Reduction Rules Applied</span>
                  </div>
                </div>
              </section>

              {/* GENERATE TODAY'S PLAN PRIMARY ACTION BUTTON */}
              <section className="text-center pt-6">
                <button
                  onClick={handleGenerateTodayPlan}
                  disabled={loading}
                  className="w-full sm:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-xl shadow-indigo-600/25 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Generating New Plan...' : "Generate Today's Plan"}</span>
                </button>
              </section>
            </>
          )}
        </div>
      </Container>

      {/* GENERATE CONFIG MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <span>Tailor Today's Mission</span>
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">
                  Available Study Time Today: <strong className="text-indigo-400">{availableMinutes} mins</strong> ({formatMinutes(availableMinutes)})
                </label>
                <input
                  type="range"
                  min="30"
                  max="360"
                  step="30"
                  value={availableMinutes}
                  onChange={(e) => setAvailableMinutes(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">
                  Your Energy Level Today
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setEnergyLevel(lvl)}
                      className={`py-2 text-xs font-semibold capitalize rounded-xl border transition-all ${
                        energyLevel === lvl
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                          : 'bg-black text-zinc-400 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <Zap className="w-3 h-3 inline mr-1" />
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateTodayPlan}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating New Plan...</span>
                </>
              ) : (
                <span>Recalculate Priority Plan</span>
              )}
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
