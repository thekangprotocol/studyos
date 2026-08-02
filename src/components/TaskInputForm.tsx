import React, { useState } from 'react';
import { studyService } from '../services/study.service';
import {
  BookOpen,
  FileText,
  Calendar,
  Clock,
  Zap,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PlusCircle,
} from 'lucide-react';

interface TaskInputFormProps {
  onTaskSaved?: () => void;
  onCancel?: () => void;
}

interface FormErrors {
  courseTitle?: string;
  assignmentTitle?: string;
  dueDate?: string;
  estimatedMinutes?: string;
  availableStudyMinutesToday?: string;
  general?: string;
}

export const TaskInputForm: React.FC<TaskInputFormProps> = ({ onTaskSaved, onCancel }) => {
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('45');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [availableStudyMinutesToday, setAvailableStudyMinutesToday] = useState('180');

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!courseTitle.trim()) {
      newErrors.courseTitle = 'Please enter a course name (e.g. CS 101 or Calculus II).';
    }

    if (!assignmentTitle.trim()) {
      newErrors.assignmentTitle = 'Please enter the assignment title or task description.';
    }

    if (!dueDate) {
      newErrors.dueDate = 'Please select a deadline date and time.';
    }

    const durationNum = Number(estimatedMinutes);
    if (!estimatedMinutes || isNaN(durationNum) || durationNum <= 0) {
      newErrors.estimatedMinutes = 'Estimated duration must be a positive number of minutes (e.g. 45).';
    }

    const availableNum = Number(availableStudyMinutesToday);
    if (!availableStudyMinutesToday || isNaN(availableNum) || availableNum <= 0) {
      newErrors.availableStudyMinutesToday = 'Available study time must be a positive number of minutes.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await studyService.saveTask({
        courseTitle,
        courseCode,
        assignmentTitle,
        description,
        dueDate,
        estimatedMinutes: Number(estimatedMinutes),
        priority,
        availableStudyMinutesToday: Number(availableStudyMinutesToday),
      });

      setSuccessMsg('Task and daily plan successfully saved to Supabase!');
      setAssignmentTitle('');
      setDescription('');

      if (onTaskSaved) {
        onTaskSaved();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrors({ general: err.message });
      } else {
        setErrors({ general: 'Failed to save task to Supabase. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 max-w-2xl mx-auto text-black dark:text-white">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black text-white dark:bg-white dark:text-black rounded-xl shadow-sm">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight font-heading">Add New Study Task</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Save to your Supabase database & recalculate your plan</p>
          </div>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {errors.general && (
        <div className="p-4 bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 rounded-2xl text-red-800 dark:text-red-300 text-xs flex items-center gap-3 font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-2xl text-black dark:text-white text-xs flex items-center gap-3 font-bold">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-black dark:text-white" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Course Name *
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="e.g. Calculus II or Computer Science"
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-xl text-sm text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition-all font-medium"
              />
            </div>
            {errors.courseTitle && (
              <p className="text-xs text-red-500 mt-1 font-semibold">{errors.courseTitle}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Course Code
            </label>
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="MATH 202"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-xl text-sm text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition-all font-medium"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Assignment / Task Title *
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={assignmentTitle}
              onChange={(e) => setAssignmentTitle(e.target.value)}
              placeholder="e.g. Problem Set 4: Integration by Parts"
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-xl text-sm text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition-all font-medium"
            />
          </div>
          {errors.assignmentTitle && (
            <p className="text-xs text-red-500 mt-1 font-semibold">{errors.assignmentTitle}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Deadline Date & Time *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-xl text-sm text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-all font-medium"
              />
            </div>
            {errors.dueDate && (
              <p className="text-xs text-red-500 mt-1 font-semibold">{errors.dueDate}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Estimated Duration (Minutes) *
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="number"
                min="5"
                max="600"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                placeholder="45"
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-xl text-sm text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-all font-medium"
              />
            </div>
            {errors.estimatedMinutes && (
              <p className="text-xs text-red-500 mt-1 font-semibold">{errors.estimatedMinutes}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Importance / Priority Level
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['low', 'medium', 'high', 'urgent'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setPriority(lvl)}
                className={`py-2.5 text-xs font-extrabold capitalize rounded-xl border transition-all ${
                  priority === lvl
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-black dark:text-zinc-400 dark:border-zinc-800'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Available Study Time Today (Minutes) *
          </label>
          <div className="relative">
            <Sliders className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="number"
              min="15"
              max="720"
              step="15"
              value={availableStudyMinutesToday}
              onChange={(e) => setAvailableStudyMinutesToday(e.target.value)}
              placeholder="180 (3 hours)"
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-xl text-sm text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-all font-medium"
            />
          </div>
          <span className="text-[11px] text-zinc-500 font-semibold">
            Current setting: {Math.floor(Number(availableStudyMinutesToday) / 60)}h {Number(availableStudyMinutesToday) % 60}m
          </span>
          {errors.availableStudyMinutesToday && (
            <p className="text-xs text-red-500 mt-1 font-semibold">{errors.availableStudyMinutesToday}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-black text-white dark:bg-white dark:text-black font-extrabold text-sm rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Task to Supabase...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Save Task & Update Study Plan</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
