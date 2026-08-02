import React, { useState, useEffect } from 'react';
import { Container } from '../components/Container';
import { dbService } from '../services/db.service';
import type { StudyTask, Exam } from '../types';
import { TaskInputForm } from '../components/TaskInputForm';
import {
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  PlusCircle,
  BookOpen,
  Calendar,
  Loader2,
  CheckSquare,
  AlertCircle,
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);

  useEffect(() => {
    loadWorkloadData();
  }, []);

  const loadWorkloadData = async () => {
    setLoading(true);
    const allT = await dbService.getAllTasks();
    const allE = await dbService.getUpcomingExams();
    setTasks(allT);
    setExams(allE);
    setLoading(false);
  };

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: nextStatus } : t))
    );
    await dbService.toggleTaskStatus(taskId, nextStatus);
  };

  const handleDeleteTask = async (taskId: string, title: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setDeleteMsg(`Deleted task "${title}"`);
    await dbService.deleteTask(taskId);
    setTimeout(() => setDeleteMsg(null), 3000);
  };

  const handleDeleteExam = async (examId: string, title: string) => {
    setExams((prev) => prev.filter((e) => e.id !== examId));
    setDeleteMsg(`Deleted exam "${title}"`);
    await dbService.deleteExam(examId);
    setTimeout(() => setDeleteMsg(null), 3000);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'active') return !t.completed;
    if (filterStatus === 'completed') return t.completed;
    return true;
  });

  return (
    <main className="py-8 sm:py-12 pb-24 text-zinc-900 dark:text-zinc-100 bg-white dark:bg-black min-h-[calc(100vh-80px)] transition-colors">
      <Container>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-900 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-black dark:text-white font-extrabold uppercase tracking-wider text-xs">
                <CheckSquare className="w-4 h-4" />
                <span>Academic Workload Backlog</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-black dark:text-white tracking-tight font-heading">
                All Things To Get Done
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                View, complete, or delete tasks and exams added manually or extracted by your AI Chief of Staff.
              </p>
            </div>

            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-3 bg-black dark:bg-white text-white dark:text-black font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all hover:opacity-90 self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New Task</span>
            </button>
          </div>

          {/* Delete Notification Banner */}
          {deleteMsg && (
            <div className="p-4 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-2xl text-xs font-bold text-black dark:text-white flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{deleteMsg}</span>
            </div>
          )}

          {/* ADD TASK FORM */}
          {showAddForm && (
            <div className="animate-in fade-in duration-200">
              <TaskInputForm
                onTaskSaved={() => {
                  setShowAddForm(false);
                  loadWorkloadData();
                }}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}

          {/* SECTION 1: UPCOMING EXAMS */}
          {exams.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-black dark:text-white tracking-tight flex items-center gap-2 font-heading">
                  <Calendar className="w-5 h-5" />
                  <span>Upcoming Exams & Quizzes ({exams.length})</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {exams.map((e) => (
                  <div
                    key={e.id}
                    className="p-5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-start justify-between gap-3 shadow-md backdrop-blur-xl"
                  >
                    <div className="space-y-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-black dark:text-white bg-zinc-200 dark:bg-black px-2.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-800">
                        {e.courseName}
                      </span>
                      <h4 className="text-base font-bold text-black dark:text-white truncate">{e.title}</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                        Date: {new Date(e.examDate).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteExam(e.id, e.title)}
                      className="p-2 text-zinc-400 hover:text-red-500 rounded-xl transition-colors shrink-0"
                      title="Delete Exam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 2: TASKS & ASSIGNMENTS */}
          <section className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-xl font-extrabold text-black dark:text-white tracking-tight flex items-center gap-2 font-heading">
                <BookOpen className="w-5 h-5" />
                <span>Assignments & Study Tasks ({filteredTasks.length})</span>
              </h2>

              {/* Filter Switcher */}
              <div className="flex bg-zinc-100 dark:bg-zinc-900/80 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
                {(['all', 'active', 'completed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-3.5 py-1 rounded-lg font-bold capitalize transition-all ${
                      filterStatus === st
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-zinc-500 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-black dark:text-white mx-auto" />
                <p className="text-xs font-bold">Loading all workload tasks from Supabase...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center space-y-3">
                <CheckSquare className="w-8 h-8 text-zinc-400 mx-auto" />
                <h4 className="text-base font-bold text-black dark:text-white">No tasks found</h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  {filterStatus === 'all'
                    ? 'Your backlog is completely empty! Add tasks manually or type updates into your Chief of Staff Chat.'
                    : `No ${filterStatus} tasks found.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-5 rounded-2xl border transition-all flex items-start gap-4 shadow-md ${
                      task.completed
                        ? 'bg-zinc-100 text-zinc-400 dark:bg-black/40 dark:border-zinc-900 opacity-60'
                        : 'bg-zinc-50 border-zinc-200 dark:bg-zinc-900/60 dark:border-zinc-800 hover:border-black dark:hover:border-white'
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleTask(task.id, task.completed)}
                      className="mt-1 shrink-0 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-black dark:text-white" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-400 dark:text-zinc-600" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-black dark:text-white bg-zinc-200 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-300 dark:border-zinc-700">
                          {task.subjectName}
                        </span>
                        {task.dueDate && (
                          <span className="text-[10px] text-zinc-600 dark:text-zinc-400 bg-white dark:bg-black px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 font-mono font-semibold">
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <h4
                        className={`text-base font-bold text-black dark:text-white leading-snug ${
                          task.completed ? 'line-through text-zinc-400 dark:text-zinc-500' : ''
                        }`}
                      >
                        {task.title}
                      </h4>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="hidden sm:flex items-center gap-1 text-black dark:text-zinc-300 font-mono text-xs bg-white dark:bg-black px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{task.estimatedMinutes}m</span>
                      </div>

                      <button
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        className="p-2 text-zinc-400 hover:text-red-500 rounded-xl transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </Container>
    </main>
  );
};
