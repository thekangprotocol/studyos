import { useState, useCallback } from 'react';
import type { StudyPlanRecommendation, DailyPromptInput } from '../types';
import { aiService } from '../services/ai.service';
import { studyService } from '../services/study.service';

/**
 * Custom React Hook: useStudyPlan
 * Encapsulates data fetching from Supabase, plan deletion, OpenAI API generation, and database persistence.
 */
export function useStudyPlan() {
  const [plan, setPlan] = useState<StudyPlanRecommendation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  /**
   * Generates a new study plan by:
   * 1. Deleting previous plan for today from Supabase
   * 2. Retrieving unfinished tasks from Supabase
   * 3. Invoking AI engine to generate structured plan
   * 4. Saving new plan to Supabase
   * 5. Refreshing state & triggering success notification
   */
  const generatePlan = useCallback(async (input: DailyPromptInput) => {
    setLoading(true);
    setError(null);
    setSuccessNotification(null);

    try {
      // 1. Delete previous plan for today from Supabase
      await studyService.deleteTodaysPlan();

      // 2. Fetch unfinished tasks from Supabase
      const unfinishedTasks = await studyService.getUnfinishedTasks();

      // 3. Send tasks + available study time to AI engine
      const newPlan = await aiService.generateDailyPlan(input, unfinishedTasks);

      // 4. Save new plan into Supabase ('daily_plans' table)
      await studyService.savePlan(newPlan);

      // 5. Refresh UI state & set success notification
      setPlan(newPlan);
      setSuccessNotification("Today's plan generated and saved successfully!");

      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setSuccessNotification(null);
      }, 5000);
    } catch (err: unknown) {
      console.error('Failed to generate study plan:', err);
      if (err instanceof Error) {
        setError(`Unable to generate plan: ${err.message}`);
      } else {
        setError('Could not generate your study recommendation. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Loads today's existing plan from Supabase if available.
   */
  const loadSavedPlan = useCallback(async () => {
    try {
      const savedPlan = await studyService.getTodaysPlan();
      if (savedPlan) {
        setPlan(savedPlan);
      }
    } catch (err) {
      console.warn('Notice loading saved plan:', err);
    }
  }, []);

  return {
    plan,
    loading,
    error,
    successNotification,
    generatePlan,
    loadSavedPlan,
    dismissSuccess: () => setSuccessNotification(null),
  };
}
