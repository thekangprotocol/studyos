/**
 * StudyOS Core Domain Types
 */

export type EnergyLevel = 'low' | 'medium' | 'high';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Subject {
  id: string;
  name: string;
  category?: string;
  difficulty: 1 | 2 | 3 | 4 | 5; // 1 (Easiest) to 5 (Hardest)
  targetExamDate?: string;
}

export interface StudyTask {
  id: string;
  subjectId: string;
  subjectName: string;
  title: string;
  estimatedMinutes: number;
  priority: Priority;
  completed: boolean;
  dueDate?: string;
}

export interface TimelineBlock {
  id: string;
  timeRange: string;
  activity: string;
  subjectName: string;
  completed: boolean;
}

export interface StudyPlanRecommendation {
  id: string;
  date: string;
  focusSubject: string;
  missionTitle: string;
  reasoning: string; // Explanation of WHY this is the priority today
  recommendedTasks: StudyTask[]; // Top 3 priorities
  timeline: TimelineBlock[];
  totalEstimatedMinutes: number;
}

export interface DailyPromptInput {
  availableMinutes: number;
  energyLevel: EnergyLevel;
  upcomingExams: Array<{ subjectName: string; daysLeft: number }>;
}
