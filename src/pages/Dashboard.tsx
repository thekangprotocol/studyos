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

  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [timeline, setTimeline] = useState<TimelineBlock[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [availableMinutes, setAvailableMinutes] = useState(120);
  const [energyLevel, setEnergyLevel] = useState<'low' | 'medium' | 'high'>('high');

  useEffect(() => {
    if (!plan && !loading) {
      generatePlan({
        availableMinutes: 120,
        energyLevel: 'high',
        upcomingExams: [{ subjectName: 'Calculus II', daysLeft: 3 }],
      });
    }
  }, [plan, loading, generatePlan]);

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
        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black px-2.5 py-0.5 rounded-full border border-zinc-700 dark:border-zinc-300 shadow-sm">
          High
        </span>
      );
    }
    if (p === 'medium') {
      return (
        <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200 px-2.5 py-0.5 rounded-full border border-zinc-400 dark:border-zinc-700">
          Medium
        </span>
      );
    }
    return (
      <span className="text-[10px] font-semibold uppercase tracking-wider bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 px-2.5 py-0.5 rounded-full border border-zinc-300 dark:border-zinc-800">
        Low
      </span>
    );
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <main className="py-10 sm:py-16 pb-24 text-zinc-900 dark:text-zinc-100 bg-white dark:bg-black transition-colors">
      <Container>
        <div className="max-w-3xl mx-auto space-y-12">
          {/* SUCCESS NOTIFICATION TOAST */}
          {successNotification && (
            <div className="p-4 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black border border-zinc-800 dark:border-zinc-200 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{successNotification}</span>
              </div>
              <button
                onClick={dismissSuccess}
                className="p-1 rounded-lg transition-colors hover:opacity-70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* GREETING SECTION */}
          <section className="space-y-4 text-left border-b border-zinc-200 dark:border-zinc-900 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 text-xs font-bold uppercase tracking-wider whitespace-nowrap shadow-sm">
                  <Calendar className="w-3.5 h-3.5 shrink-0 text-black dark:text-white" />
                  <span>{formatTodayHeader()}</span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-black dark:text-white leading-none">
                  Good day, {getUserName()}.
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg font-normal">
                  Here is your focused study mission for today. No overthinking. Just execution.
                </p>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                <button
                  onClick={() => setShowTaskForm(true)}
                  disabled={loading}
                  className="px-4 py-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-800 text-black dark:text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Task</span>
                </button>

                <button
                  onClick={handleGenerateTodayPlan}
                  disabled={loading}
                  className="px-5 py-3 bg-black dark:bg-white text-white dark:text-black font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
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
            <div className="bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-800 rounded-3xl p-12 text-center space-y-5 backdrop-blur-xl shadow-2xl animate-pulse">
              <div className="w-12 h-12 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mx-auto shadow-md">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-black dark:text-white">Querying AI Chief of Staff Engine...</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Synthesizing academic memory • Calculating deadline priority • Generating today's schedule
                </p>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {error && (
            <div className="bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800/50 rounded-2xl p-4 text-center text-sm font-semibold">
              {error}
            </div>
          )}

          {plan && !loading && (
            <>
              {/* 1. TODAY'S MISSION CARD */}
              <section className="relative overflow-hidden bg-zinc-900 text-white dark:bg-black dark:border-zinc-800 border border-zinc-800 rounded-3xl p-8 sm:p-10 backdrop-blur-2xl shadow-2xl space-y-6">
                <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-300">
                    <Target className="w-4 h-4 text-white" />
                    <span>Today's Primary Mission</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-300 bg-black px-3 py-1 rounded-full border border-zinc-800 font-mono">
                    <Clock className="w-3.5 h-3.5 text-white" />
                    <span>{formatMinutes(plan.totalEstimatedMinutes)} target</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-widest bg-white text-black px-3 py-1 rounded-md">
                    {plan.focusSubject}
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight font-heading">
                    {plan.missionTitle}
                  </h2>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs text-zinc-400">
                  <span>
                    Status:{' '}
                    <strong className="text-white font-bold">
                      {completedCount === tasks.length && tasks.length > 0
                        ? 'Mission Complete 🎉'
                        : `${completedCount} of ${tasks.length} Completed`}
                    </strong>
                  </span>
                  <button
                    onClick={() => setShowConfigModal(true)}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white font-bold transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tailor Hours & Energy</span>
                  </button>
                </div>
              </section>

              {/* 2. TOP 3 PRIORITY CARDS */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-extrabold text-black dark:text-white tracking-tight">
                    Top 3 Priorities
                  </h3>
                  <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
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
                          ? 'bg-zinc-100 text-zinc-400 dark:bg-black/40 dark:border-zinc-900 border-zinc-200 opacity-60'
                          : 'bg-zinc-50 border-zinc-200 dark:bg-zinc-900/80 dark:border-zinc-800 hover:border-black dark:hover:border-white'
                      }`}
                    >
                      <button className="mt-1 shrink-0 text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
                        {task.completed ? (
                          <CheckCircle2 className="w-6 h-6 text-black dark:text-white" />
                        ) : (
                          <Circle className="w-6 h-6 text-zinc-400 dark:text-zinc-600" />
                        )}
                      </button>

                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider bg-zinc-200 dark:bg-black px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-800">
                            Priority 0{idx + 1}
                          </span>
                          <span className="text-[10px] font-bold text-black dark:text-white bg-zinc-200 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-300 dark:border-zinc-700">
                            {task.subjectName}
                          </span>
                          {getPriorityBadge(task.priority)}
                        </div>

                        <h4
                          className={`text-lg font-bold leading-snug text-black dark:text-white ${
                            task.completed ? 'line-through text-zinc-400 dark:text-zinc-500' : ''
                          }`}
                        >
                          {task.title}
                        </h4>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-1 text-black dark:text-zinc-300 font-mono text-xs bg-zinc-200 dark:bg-black px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-800">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{task.estimatedMinutes}m</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 3. TIMELINE CARDS */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-extrabold text-black dark:text-white tracking-tight">
                    Study Schedule & Timeline
                  </h3>
                  <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Today</span>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
                  {timeline.map((block, idx) => (
                    <div
                      key={block.id}
                      onClick={() => toggleTimeline(block.id)}
                      className="cursor-pointer flex items-start gap-4 relative group"
                    >
                      {idx !== timeline.length - 1 && (
                        <div className="absolute left-[11px] top-7 bottom-0 w-[2px] bg-zinc-300 dark:bg-zinc-800 group-hover:bg-black dark:group-hover:bg-white transition-colors" />
                      )}

                      <button className="mt-0.5 shrink-0 z-10 bg-white dark:bg-black rounded-full">
                        {block.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-black dark:text-white" />
                        ) : (
                          <Circle className="w-5 h-5 text-zinc-400 dark:text-zinc-600 group-hover:text-black dark:group-hover:text-white" />
                        )}
                      </button>

                      <div className="flex-1 space-y-1 bg-white dark:bg-black p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 group-hover:border-black dark:group-hover:border-white transition-colors shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-bold text-black dark:text-white flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {block.timeRange}
                          </span>
                          <span className="text-[10px] text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 font-semibold">
                            {block.subjectName}
                          </span>
                        </div>
                        <p
                          className={`text-sm font-semibold text-zinc-900 dark:text-zinc-100 ${
                            block.completed ? 'line-through text-zinc-400 dark:text-zinc-500' : ''
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
                <div className="bg-zinc-900 text-white dark:bg-black border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-white">
                      <BrainCircuit className="w-4.5 h-4.5" />
                      <span>AI Engine Decision & Reasoning Proof</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-black text-[10px] font-black uppercase">
                        <ShieldCheck className="w-3 h-3 text-black" />
                        AI Verified
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-200 text-[10px] font-bold border border-zinc-700">
                        <Cpu className="w-3 h-3 text-zinc-300" />
                        Gemini 2.0 / Chief Engine
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-200 leading-relaxed font-medium">
                    {plan.reasoning}
                  </p>

                  <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                    <span className="font-bold text-zinc-500">Active Inputs:</span>
                    <span className="bg-black px-2.5 py-1 rounded-lg border border-zinc-800 text-zinc-300 font-mono font-semibold">Academic Memory Loaded</span>
                    <span className="bg-black px-2.5 py-1 rounded-lg border border-zinc-800 text-zinc-300 font-mono font-semibold">GPA Optimization Active</span>
                    <span className="bg-black px-2.5 py-1 rounded-lg border border-zinc-800 text-zinc-300 font-mono font-semibold">Stress Reduction Rules Applied</span>
                  </div>
                </div>
              </section>

              {/* GENERATE TODAY'S PLAN PRIMARY ACTION BUTTON */}
              <section className="text-center pt-6">
                <button
                  onClick={handleGenerateTodayPlan}
                  disabled={loading}
                  className="w-full sm:w-auto px-10 py-4 bg-black dark:bg-white text-white dark:text-black font-extrabold text-sm rounded-2xl shadow-2xl transition-all hover:opacity-90 inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
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
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl text-black dark:text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Sliders className="w-5 h-5" />
                <span>Tailor Today's Mission</span>
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-zinc-500 hover:text-black dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                  Available Study Time Today: <strong>{availableMinutes} mins</strong> ({formatMinutes(availableMinutes)})
                </label>
                <input
                  type="range"
                  min="30"
                  max="360"
                  step="30"
                  value={availableMinutes}
                  onChange={(e) => setAvailableMinutes(Number(e.target.value))}
                  className="w-full accent-black dark:accent-white cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                  Your Energy Level Today
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setEnergyLevel(lvl)}
                      className={`py-2 text-xs font-bold capitalize rounded-xl border transition-all ${
                        energyLevel === lvl
                          ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-black dark:text-zinc-400 dark:border-zinc-800'
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
              className="w-full py-3 bg-black text-white dark:bg-white dark:text-black font-extrabold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
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
