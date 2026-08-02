import { supabase } from '../lib/supabase';
import type { UserProfile, Subject, StudyTask, Exam, StudentMemory, ChatMessage } from '../types';

/**
 * Database Service Layer
 * Centralized Supabase interactions for StudyOS AI Chief of Staff.
 */
export const dbService = {
  /**
   * Get current authenticated user profile.
   */
  async getUserProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const localCompleted = localStorage.getItem(`onboarding_completed_${user.id}`) === 'true';

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !data) {
      return {
        id: user.id,
        email: user.email || '',
        fullName: user.user_metadata?.full_name || '',
        onboardingCompleted: localCompleted,
      };
    }

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      gradeLevel: data.grade_level,
      schoolName: data.school_name,
      targetGrades: data.target_grades,
      procrastinationTriggers: data.procrastination_triggers,
      dailyAvailableHours: data.daily_available_hours,
      preferredStudyTimes: data.preferred_study_times,
      onboardingCompleted: data.onboarding_completed || localCompleted,
    };
  },

  /**
   * Update user profile & onboarding status safely via upsert.
   */
  async updateUserProfile(profile: Partial<UserProfile>): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    if (profile.onboardingCompleted) {
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
    }

    const upsertData: Record<string, any> = {
      id: user.id,
      email: user.email || '',
    };

    if (profile.fullName !== undefined) upsertData.full_name = profile.fullName;
    if (profile.gradeLevel !== undefined) upsertData.grade_level = profile.gradeLevel;
    if (profile.schoolName !== undefined) upsertData.school_name = profile.schoolName;
    if (profile.targetGrades !== undefined) upsertData.target_grades = profile.targetGrades;
    if (profile.procrastinationTriggers !== undefined) upsertData.procrastination_triggers = profile.procrastinationTriggers;
    if (profile.dailyAvailableHours !== undefined) upsertData.daily_available_hours = profile.dailyAvailableHours;
    if (profile.preferredStudyTimes !== undefined) upsertData.preferred_study_times = profile.preferredStudyTimes;
    if (profile.onboardingCompleted !== undefined) upsertData.onboarding_completed = profile.onboardingCompleted;

    const { error } = await supabase
      .from('users')
      .upsert(upsertData, { onConflict: 'id' });

    if (error) {
      console.warn('Notice updating user profile in Supabase (local fallback active):', error.message);
    }
    return true;
  },

  /**
   * Add a course/subject for the student.
   */
  async addCourse(title: string, code?: string, difficultyLevel: number = 3): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: existing } = await supabase
      .from('courses')
      .select('id')
      .eq('user_id', user.id)
      .ilike('title', title.trim())
      .maybeSingle();

    if (existing) return existing.id;

    const { data, error } = await supabase
      .from('courses')
      .insert({
        user_id: user.id,
        title: title.trim(),
        code: code?.trim() || null,
        difficulty_level: difficultyLevel,
      })
      .select('id')
      .single();

    if (error || !data) return null;
    return data.id;
  },

  /**
   * Fetch courses for student.
   */
  async getCourses(): Promise<Subject[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', user.id)
      .order('title');

    if (error || !data) return [];
    return data.map((c: any) => ({
      id: c.id,
      name: c.title,
      category: c.code,
      difficulty: c.difficulty_level || 3,
    }));
  },

  /**
   * Add or save a task.
   */
  async addTask(task: { title: string; courseName?: string; dueDate?: string; estimatedMinutes?: number; priority?: string }): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    let courseId: string | null = null;
    if (task.courseName) {
      courseId = await this.addCourse(task.courseName);
    }

    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      course_id: courseId,
      title: task.title,
      due_date: task.dueDate ? new Date(task.dueDate).toISOString() : null,
      estimated_minutes: task.estimatedMinutes || 45,
      priority: task.priority || 'medium',
      status: 'todo',
    });

    return !error;
  },

  /**
   * Fetch active unfinished tasks.
   */
  async getUnfinishedTasks(): Promise<StudyTask[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('tasks')
      .select('*, courses(title)')
      .eq('user_id', user.id)
      .neq('status', 'completed')
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error || !data) return [];

    return data.map((t: any) => ({
      id: t.id,
      subjectId: t.course_id || 'general',
      subjectName: t.courses?.title || 'General Study',
      title: t.title,
      estimatedMinutes: t.estimated_minutes || 45,
      priority: t.priority || 'medium',
      completed: t.status === 'completed',
      dueDate: t.due_date,
    }));
  },

  /**
   * Fetch ALL tasks (both active and completed).
   */
  async getAllTasks(): Promise<StudyTask[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('tasks')
      .select('*, courses(title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((t: any) => ({
      id: t.id,
      subjectId: t.course_id || 'general',
      subjectName: t.courses?.title || 'General Study',
      title: t.title,
      estimatedMinutes: t.estimated_minutes || 45,
      priority: t.priority || 'medium',
      completed: t.status === 'completed',
      dueDate: t.due_date,
    }));
  },

  /**
   * Delete a task by ID.
   */
  async deleteTask(taskId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id);

    return !error;
  },

  /**
   * Delete an exam by ID.
   */
  async deleteExam(examId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', examId)
      .eq('user_id', user.id);

    return !error;
  },

  /**
   * Toggle task completed status.
   */
  async toggleTaskStatus(taskId: string, completed: boolean): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('tasks')
      .update({ status: completed ? 'completed' : 'todo' })
      .eq('id', taskId)
      .eq('user_id', user.id);

    return !error;
  },

  /**
   * Mark task complete matching title.
   */
  async markTaskCompleteByTitle(titleSnippet: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('tasks')
      .update({ status: 'completed' })
      .eq('user_id', user.id)
      .ilike('title', `%${titleSnippet.trim()}%`);

    return !error;
  },

  /**
   * Add an upcoming exam.
   */
  async addExam(exam: { title: string; courseName: string; examDate: string }): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const courseId = await this.addCourse(exam.courseName);

    const { error } = await supabase.from('exams').insert({
      user_id: user.id,
      course_id: courseId,
      title: exam.title,
      exam_date: new Date(exam.examDate).toISOString(),
      status: 'upcoming',
    });

    return !error;
  },

  /**
   * Fetch active upcoming exams.
   */
  async getUpcomingExams(): Promise<Exam[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('exams')
      .select('*, courses(title)')
      .eq('user_id', user.id)
      .eq('status', 'upcoming')
      .order('exam_date', { ascending: true });

    if (error || !data) return [];

    return data.map((e: any) => ({
      id: e.id,
      courseId: e.course_id,
      courseName: e.courses?.title || 'General Exam',
      title: e.title,
      examDate: e.exam_date,
      weight: e.weight,
      status: e.status,
    }));
  },

  /**
   * Save a student memory.
   */
  async addMemory(memoryType: StudentMemory['memoryType'], content: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from('student_memories').insert({
      user_id: user.id,
      memory_type: memoryType,
      content,
    });

    return !error;
  },

  /**
   * Fetch all student memories.
   */
  async getMemories(): Promise<StudentMemory[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('student_memories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((m: any) => ({
      id: m.id,
      memoryType: m.memory_type,
      content: m.content,
      relevanceScore: m.relevance_score,
    }));
  },

  /**
   * Save conversation message to history.
   */
  async saveMessage(role: 'user' | 'assistant', content: string, metadata?: Record<string, any>): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from('conversation_messages').insert({
      user_id: user.id,
      role,
      content,
      metadata: metadata || null,
    });

    return !error;
  },

  /**
   * Fetch last N conversation messages.
   */
  async getRecentMessages(limit: number = 20): Promise<ChatMessage[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error || !data) return [];

    return data.map((m: any) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      metadata: m.metadata,
      createdAt: m.created_at,
    }));
  },

  /**
   * Clear all conversation messages for user.
   */
  async clearChatHistory(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('conversation_messages')
      .delete()
      .eq('user_id', user.id);

    return !error;
  },

  /**
   * Delete user account data permanently from Supabase & Local Storage.
   */
  async deleteUserAccount(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    localStorage.removeItem(`onboarding_completed_${user.id}`);

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);

    if (error) {
      console.warn('Notice deleting user row in public.users:', error.message);
    }

    return true;
  },
};
