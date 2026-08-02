/**
 * StudyOS AI Academic Chief of Staff Core Types
 */

export type EnergyLevel = 'low' | 'medium' | 'high';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  gradeLevel?: string;
  schoolName?: string;
  targetGrades?: string;
  procrastinationTriggers?: string;
  dailyAvailableHours?: number;
  preferredStudyTimes?: string;
  onboardingCompleted: boolean;
}

export interface Subject {
  id: string;
  name: string;
  category?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  targetGrade?: string;
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

export interface Exam {
  id: string;
  courseId?: string;
  courseName: string;
  title: string;
  examDate: string;
  weight?: string;
  status: 'upcoming' | 'completed';
}

export interface StudentMemory {
  id: string;
  memoryType: 'challenge' | 'preference' | 'goal' | 'habit' | 'subject_note';
  content: string;
  relevanceScore?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  createdAt?: string;
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
  reasoning: string;
  recommendedTasks: StudyTask[];
  timeline: TimelineBlock[];
  totalEstimatedMinutes: number;
}

export interface DailyPromptInput {
  availableMinutes: number;
  energyLevel: EnergyLevel;
  upcomingExams: Array<{ subjectName: string; daysLeft: number }>;
}

export interface ExtractedIntent {
  intentType: 'add_exam' | 'complete_task' | 'add_task' | 'update_challenge' | 'general_chat';
  summary: string;
  entities: {
    subjectName?: string;
    taskTitle?: string;
    examTitle?: string;
    examDate?: string;
    challengeNote?: string;
  };
}
