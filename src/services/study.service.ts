import { supabase } from '../lib/supabase';
import type { StudyPlanRecommendation, StudyTask } from '../types';

export interface CreateTaskPayload {
  courseTitle: string;
  courseCode?: string;
  assignmentTitle: string;
  description?: string;
  dueDate: string;
  estimatedMinutes: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  availableStudyMinutesToday: number;
}

/**
 * Study Database Service
 * Handles data fetching and persistence with Supabase for study recommendations, tasks, courses, and daily plans.
 */
export const studyService = {
  /**
   * Deletes the previous plan for today from Supabase 'daily_plans' table.
   */
  async deleteTodaysPlan(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const todayStr = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('daily_plans')
        .delete()
        .eq('user_id', user.id)
        .eq('plan_date', todayStr);

      if (error) {
        console.warn('Notice deleting previous plan from Supabase:', error.message);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error deleting previous plan:', error);
      return false;
    }
  },

  /**
   * Fetches all unfinished tasks for the current user from Supabase.
   */
  async getUnfinishedTasks(): Promise<StudyTask[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('tasks')
      .select('*, courses(title)')
      .eq('user_id', user.id)
      .neq('status', 'completed')
      .order('due_date', { ascending: true });

    if (error) {
      console.warn('Error fetching unfinished tasks from Supabase:', error.message);
      return [];
    }

    return (data || []).map((t: any) => ({
      id: t.id,
      subjectId: t.course_id || 'general',
      subjectName: t.courses?.title || 'General Study',
      title: t.title,
      estimatedMinutes: t.estimated_minutes || 30,
      priority: t.priority || 'medium',
      completed: t.status === 'completed',
      dueDate: t.due_date,
    }));
  },

  /**
   * Fetches courses for the authenticated user.
   */
  async getCourses() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', user.id)
      .order('title');

    if (error) {
      console.warn('Error fetching courses from Supabase:', error.message);
      return [];
    }
    return data || [];
  },

  /**
   * Saves a new task (and creates course + daily plan if needed) in Supabase.
   */
  async saveTask(payload: CreateTaskPayload) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be logged in to save tasks.');
    }

    let courseId: string | null = null;
    if (payload.courseTitle.trim()) {
      const { data: existingCourse } = await supabase
        .from('courses')
        .select('id')
        .eq('user_id', user.id)
        .ilike('title', payload.courseTitle.trim())
        .maybeSingle();

      if (existingCourse) {
        courseId = existingCourse.id;
      } else {
        const { data: newCourse, error: courseError } = await supabase
          .from('courses')
          .insert({
            user_id: user.id,
            title: payload.courseTitle.trim(),
            code: payload.courseCode?.trim() || null,
          })
          .select('id')
          .single();

        if (courseError) {
          console.warn('Failed to insert new course into Supabase:', courseError.message);
        } else {
          courseId = newCourse.id;
        }
      }
    }

    const dbPriority = payload.priority === 'urgent' ? 'high' : payload.priority;

    const { data: newTask, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        course_id: courseId,
        title: payload.assignmentTitle.trim(),
        description: payload.description?.trim() || null,
        due_date: new Date(payload.dueDate).toISOString(),
        estimated_minutes: Number(payload.estimatedMinutes),
        priority: dbPriority,
        status: 'todo',
      })
      .select('*')
      .single();

    if (taskError) {
      console.error('Supabase task insert error:', taskError);
      throw new Error(`Failed to save task: ${taskError.message}`);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const targetHours = (payload.availableStudyMinutesToday / 60).toFixed(1);

    const { error: planError } = await supabase
      .from('daily_plans')
      .upsert(
        {
          user_id: user.id,
          plan_date: todayStr,
          target_study_hours: Number(targetHours),
          status: 'planned',
        },
        { onConflict: 'user_id,plan_date' }
      );

    if (planError) {
      console.warn('Daily plan upsert warning:', planError.message);
    }

    return newTask;
  },

  /**
   * Fetches today's study plan recommendation from Supabase.
   */
  async getTodaysPlan(): Promise<StudyPlanRecommendation | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const todayStr = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_date', todayStr)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      if (data.notes) {
        try {
          const parsed = JSON.parse(data.notes);
          if (parsed.missionTitle && parsed.recommendedTasks) {
            return parsed as StudyPlanRecommendation;
          }
        } catch {
          // If notes is plain text reasoning fallback
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching today study plan from Supabase:', error);
      return null;
    }
  },

  /**
   * Saves a generated study plan to Supabase 'daily_plans' table.
   */
  async savePlan(plan: StudyPlanRecommendation): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const todayStr = new Date().toISOString().split('T')[0];
      const targetHours = (plan.totalEstimatedMinutes / 60).toFixed(1);

      const { error } = await supabase.from('daily_plans').upsert(
        {
          user_id: user.id,
          plan_date: todayStr,
          target_study_hours: Number(targetHours),
          status: 'planned',
          notes: JSON.stringify(plan),
        },
        { onConflict: 'user_id,plan_date' }
      );

      if (error) {
        console.warn('Supabase save plan warning:', error.message);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error saving study plan to Supabase:', error);
      return false;
    }
  },
};
