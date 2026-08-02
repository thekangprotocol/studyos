import { dbService } from './db.service';
import { aiService } from './ai.service';
import type { StudyPlanRecommendation } from '../types';

/**
 * Schedule Service
 * Responsible for constructing today's study plan by blending student profile, long-term memory,
 * active tasks, and upcoming exams.
 */
export const scheduleService = {
  /**
   * Generates or recalculates today's study plan.
   */
  async generateDailySchedule(): Promise<StudyPlanRecommendation> {
    const profile = await dbService.getUserProfile();
    const tasks = await dbService.getUnfinishedTasks();
    const exams = await dbService.getUpcomingExams();
    const memories = await dbService.getMemories();

    const availableHours = profile?.dailyAvailableHours || 3.0;
    const availableMinutes = Math.round(availableHours * 60);

    const upcomingExamsInput = exams.map((e) => {
      const daysLeft = Math.max(1, Math.ceil((new Date(e.examDate).getTime() - Date.now()) / (1000 * 3600 * 24)));
      return { subjectName: e.courseName, daysLeft };
    });

    const plan = await aiService.generateDailyPlan(
      {
        availableMinutes,
        energyLevel: 'high',
        upcomingExams: upcomingExamsInput,
      },
      tasks
    );

    const challengeMemories = memories.filter((m) => m.memoryType === 'challenge');
    if (challengeMemories.length > 0) {
      plan.reasoning += ` Also prioritized based on your noted challenge: "${challengeMemories[0].content}".`;
    }

    await dbService.saveMessage(
      'assistant',
      `Generated Today's Study Plan: ${plan.missionTitle}`,
      { planId: plan.id }
    );

    return plan;
  },
};
