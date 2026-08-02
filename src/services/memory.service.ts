import { dbService } from './db.service';
import type { StudentMemory } from '../types';

/**
 * Memory Service
 * Manages student's long-term academic context, learning challenges, and preferences.
 */
export const memoryService = {
  /**
   * Stores a new memory point for the student.
   */
  async recordMemory(type: StudentMemory['memoryType'], content: string): Promise<boolean> {
    return await dbService.addMemory(type, content);
  },

  /**
   * Retrieves all memories for current user.
   */
  async getMemories(): Promise<StudentMemory[]> {
    return await dbService.getMemories();
  },

  /**
   * Compiles the full academic context string to inject into OpenAI prompt headers.
   */
  async assembleAcademicContext(): Promise<string> {
    const profile = await dbService.getUserProfile();
    const courses = await dbService.getCourses();
    const tasks = await dbService.getUnfinishedTasks();
    const exams = await dbService.getUpcomingExams();
    const memories = await dbService.getMemories();

    const sections: string[] = [];

    if (profile) {
      sections.push(
        `PROFILE: Student in ${profile.gradeLevel || 'school'} at ${profile.schoolName || 'School'}. Target Grades: ${profile.targetGrades || 'A/B'}. Available hours/day: ${profile.dailyAvailableHours || 3}h. Procrastination Triggers: ${profile.procrastinationTriggers || 'None specified'}.`
      );
    }

    if (courses.length > 0) {
      sections.push(
        `ENROLLED COURSES: ${courses.map((c) => `${c.name} (Difficulty: ${c.difficulty}/5)`).join(', ')}`
      );
    }

    if (exams.length > 0) {
      sections.push(
        `UPCOMING EXAMS: ${exams.map((e) => `${e.title} in ${e.courseName} on ${new Date(e.examDate).toLocaleDateString()}`).join(', ')}`
      );
    }

    if (tasks.length > 0) {
      sections.push(
        `ACTIVE ASSIGNMENTS (${tasks.length}): ${tasks.map((t) => `${t.title} [${t.subjectName}] due ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'soon'} (${t.estimatedMinutes}m)`).join('; ')}`
      );
    }

    if (memories.length > 0) {
      sections.push(
        `LONG-TERM MEMORY & CHALLENGES: ${memories.map((m) => `[${m.memoryType.toUpperCase()}] ${m.content}`).join('; ')}`
      );
    }

    return sections.join('\n\n');
  },
};
