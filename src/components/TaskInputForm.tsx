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
  // Form input states
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('45');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [availableStudyMinutesToday, setAvailableStudyMinutesToday] = useState('180');

  // UI status states
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Field validation function
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
    } else {
      const selectedDate = new Date(dueDate);
      if (isNaN(selectedDate.getTime())) {
        newErrors.dueDate = 'Please provide a valid date.';
      } else if (selectedDate < new Date(Date.now() - 5 * 60 * 1000)) {
        newErrors.dueDate = 'Deadline should be a future date and time.';
      }
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
      
      // Reset main fields
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
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Add New Study Task</h3>
            <p className="text-xs text-slate-400">Save to your Supabase database & recalculate your plan</p>
          </div>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* General Error Banner */}
      {errors.general && (
        <div className="p-4 bg-red-950/60 border border-red-800/60 rounded-2xl text-red-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800/60 rounded-2xl text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. COURSE FIELD */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Course Name <span className="text-indigo-400">*</span>
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="e.g. Calculus II or Computer Science"
                className={`w-full pl-10 pr-4 py-3 bg-slate-950/80 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                  errors.courseTitle
                    ? 'border-red-500/80 focus:border-red-500'
                    : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                }`}
              />
            </div>
            {errors.courseTitle && (
              <p className="text-xs text-red-400 mt-1">{errors.courseTitle}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Course Code
            </label>
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="MATH 202"
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* 2. ASSIGNMENT FIELD */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Assignment / Task Title <span className="text-indigo-400">*</span>
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={assignmentTitle}
              onChange={(e) => setAssignmentTitle(e.target.value)}
              placeholder="e.g. Problem Set 4: Integration by Parts"
              className={`w-full pl-10 pr-4 py-3 bg-slate-950/80 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                errors.assignmentTitle
                  ? 'border-red-500/80 focus:border-red-500'
                  : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
              }`}
            />
          </div>
          {errors.assignmentTitle && (
            <p className="text-xs text-red-400 mt-1">{errors.assignmentTitle}</p>
          )}
        </div>

        {/* 3. DEADLINE FIELD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Deadline Date & Time <span className="text-indigo-400">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 bg-slate-950/80 border rounded-xl text-sm text-slate-100 focus:outline-none transition-all ${
                  errors.dueDate
                    ? 'border-red-500/80 focus:border-red-500'
                    : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                }`}
              />
            </div>
            {errors.dueDate && (
              <p className="text-xs text-red-400 mt-1">{errors.dueDate}</p>
            )}
          </div>

          {/* 4. ESTIMATED DURATION FIELD */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Estimated Duration (Minutes) <span className="text-indigo-400">*</span>
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="number"
                min="5"
                max="600"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                placeholder="45"
                className={`w-full pl-10 pr-4 py-3 bg-slate-950/80 border rounded-xl text-sm text-slate-100 focus:outline-none transition-all ${
                  errors.estimatedMinutes
                    ? 'border-red-500/80 focus:border-red-500'
                    : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                }`}
              />
            </div>
            {errors.estimatedMinutes && (
              <p className="text-xs text-red-400 mt-1">{errors.estimatedMinutes}</p>
            )}
          </div>
        </div>

        {/* 5. IMPORTANCE / PRIORITY SELECTOR */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Importance / Priority Level
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['low', 'medium', 'high', 'urgent'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setPriority(lvl)}
                className={`py-2.5 text-xs font-semibold capitalize rounded-xl border transition-all ${
                  priority === lvl
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* 6. AVAILABLE STUDY TIME TODAY */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Available Study Time Today (Minutes) <span className="text-indigo-400">*</span>
          </label>
          <div className="relative">
            <Sliders className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="number"
              min="15"
              max="720"
              step="15"
              value={availableStudyMinutesToday}
              onChange={(e) => setAvailableStudyMinutesToday(e.target.value)}
              placeholder="180 (3 hours)"
              className={`w-full pl-10 pr-4 py-3 bg-slate-950/80 border rounded-xl text-sm text-slate-100 focus:outline-none transition-all ${
                errors.availableStudyMinutesToday
                  ? 'border-red-500/80 focus:border-red-500'
                  : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
              }`}
            />
          </div>
          <span className="text-[11px] text-slate-400">
            Current setting: {Math.floor(Number(availableStudyMinutesToday) / 60)}h {Number(availableStudyMinutesToday) % 60}m
          </span>
          {errors.availableStudyMinutesToday && (
            <p className="text-xs text-red-400 mt-1">{errors.availableStudyMinutesToday}</p>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
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
