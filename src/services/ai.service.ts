import { openai } from '../lib/openai';
import type { DailyPromptInput, StudyPlanRecommendation, StudyTask } from '../types';

export const aiService = {
  /**
   * System Prompt configuration for StudyOS AI Engine.
   */
  getSystemPrompt(): string {
    return `You are StudyOS.
You are an AI academic planner.
Your objective is maximizing grades while minimizing stress.

Rules:
1. Choose ONLY the three highest-value tasks.
2. Prioritize by:
   - Deadline (Overdue tasks MUST be prioritized first)
   - Grade impact
   - Estimated effort
3. Avoid scheduling more minutes than available.
4. Break large work into chunks.
5. Reduce context switching.
6. Output valid JSON only.

Output Format:
{
  "priorities": [
    {
      "task": "Task title or description",
      "reason": "Why this task was selected to maximize grades & minimize stress",
      "priority": "High"
    }
  ],
  "schedule": [
    {
      "start": "09:00 AM",
      "end": "09:45 AM",
      "task": "Focus session task description"
    }
  ]
}`;
  },

  /**
   * Generates a tailored study recommendation with full edge-case protection & multi-provider AI support (Gemini, OpenAI, Fallback).
   */
  async generateDailyPlan(
    input: DailyPromptInput,
    unfinishedTasks: StudyTask[] = []
  ): Promise<StudyPlanRecommendation> {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (unfinishedTasks.length === 0) {
      return this.generateZeroTasksPlan(input);
    }

    const sanitizedTasks = unfinishedTasks.slice(0, 15);
    const sanitizedMinutes = Math.max(15, input.availableMinutes || 60);

    const userContent = {
      availableMinutes: sanitizedMinutes,
      energyLevel: input.energyLevel || 'medium',
      upcomingExams: input.upcomingExams || [],
      unfinishedTasksCount: sanitizedTasks.length,
      unfinishedTasksList: sanitizedTasks.map((t) => {
        const isOverdue = t.dueDate ? new Date(t.dueDate) < new Date() : false;
        return {
          subject: t.subjectName,
          task: `${isOverdue ? '[OVERDUE] ' : ''}${t.title}`,
          dueDate: t.dueDate,
          estimatedMinutes: t.estimatedMinutes,
          priority: isOverdue ? 'urgent' : t.priority,
        };
      }),
    };

    // Provider 1: Try 100% FREE Google Gemini 2.0 Flash
    if (geminiKey && !geminiKey.includes('your-gemini-api-key')) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `${this.getSystemPrompt()}\n\nStudent Context:\n${JSON.stringify(userContent, null, 2)}`,
                    },
                  ],
                },
              ],
              generationConfig: { responseMimeType: 'application/json' },
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            return this.parseResponseToRecommendation(content, sanitizedTasks, sanitizedMinutes);
          }
        }
      } catch (err) {
        console.warn('Gemini API call notice. Trying OpenAI or fallback:', err);
      }
    }

    // Provider 2: Try OpenAI if API Key provided
    if (openaiKey && !openaiKey.includes('your-openai-api-key') && openaiKey !== 'placeholder-key') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await openai.chat.completions.create(
          {
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: this.getSystemPrompt() },
              {
                role: 'user',
                content: `Student Context:\n${JSON.stringify(userContent, null, 2)}`,
              },
            ],
            temperature: 0.7,
          },
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        const content = response.choices[0]?.message?.content;
        if (content) {
          return this.parseResponseToRecommendation(content, sanitizedTasks, sanitizedMinutes);
        }
      } catch (err: unknown) {
        console.warn('OpenAI API call timed out or failed. Falling back to local rules engine:', err);
      }
    }

    // Provider 3: 100% Free Smart Local Heuristics Engine (Zero API Keys Required)
    return this.generateFallbackPlan(input, unfinishedTasks);
  },

  /**
   * Helper to parse AI JSON response into StudyPlanRecommendation structure.
   */
  parseResponseToRecommendation(
    content: string,
    sanitizedTasks: StudyTask[],
    sanitizedMinutes: number
  ): StudyPlanRecommendation {
    const parsed = JSON.parse(content);
    const prioritiesList = parsed.priorities || [];
    const scheduleList = parsed.schedule || [];

    const focusSubject = sanitizedTasks[0]?.subjectName || 'General Study';
    const reasoning = prioritiesList[0]?.reason ||
      `Selected top priorities to maximize grade impact within your ${sanitizedMinutes} available minutes.`;

    return {
      id: `plan-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      focusSubject,
      missionTitle: prioritiesList[0]?.task ? `Focus: ${prioritiesList[0].task}` : `Master ${focusSubject} & High-Value Priorities`,
      reasoning,
      recommendedTasks: prioritiesList.slice(0, 3).map((p: any, idx: number) => ({
        id: `p-${idx + 1}`,
        subjectId: `sub-${idx}`,
        subjectName: focusSubject,
        title: p.task,
        estimatedMinutes: Math.min(60, Math.floor(sanitizedMinutes / 3)),
        priority: p.priority?.toLowerCase() === 'high' ? 'high' : 'medium',
        completed: false,
      })),
      timeline: scheduleList.map((s: any, idx: number) => ({
        id: `tb-${idx + 1}`,
        timeRange: `${s.start || ''} - ${s.end || ''}`.trim() || `Session ${idx + 1}`,
        activity: s.task,
        subjectName: focusSubject,
        completed: false,
      })),
      totalEstimatedMinutes: sanitizedMinutes,
    };
  },

  /**
   * Plan generated when user has zero assignments.
   */
  generateZeroTasksPlan(input: DailyPromptInput): StudyPlanRecommendation {
    const minutes = Math.max(15, input.availableMinutes || 60);
    return {
      id: `plan-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      focusSubject: 'All Caught Up 🎉',
      missionTitle: 'Rest, Reflect, or Light Pre-Reading',
      reasoning: 'You have no pending assignments! Take time to recharge or do 15 minutes of light pre-reading for upcoming lectures.',
      recommendedTasks: [
        {
          id: 'p-1',
          subjectId: 'sub-rest',
          subjectName: 'Wellness & Rest',
          title: 'Take a well-deserved break or organize notes',
          estimatedMinutes: Math.min(30, minutes),
          priority: 'low',
          completed: false,
        },
      ],
      timeline: [
        {
          id: 'tb-1',
          timeRange: '09:00 AM - 09:30 AM',
          activity: 'Light note organization or relaxation',
          subjectName: 'Wellness',
          completed: false,
        },
      ],
      totalEstimatedMinutes: minutes,
    };
  },

  /**
   * Resilient fallback generator for offline mode, network failure, or API timeout.
   */
  generateFallbackPlan(
    input: DailyPromptInput,
    unfinishedTasks: StudyTask[] = []
  ): StudyPlanRecommendation {
    if (unfinishedTasks.length === 0) {
      return this.generateZeroTasksPlan(input);
    }

    const minutes = Math.max(15, input.availableMinutes || 60);
    const focusSub = unfinishedTasks[0]?.subjectName || 'Calculus II';

    const priorities = [
      {
        task: unfinishedTasks[0]?.title || 'Review Integration by Parts & Exam Questions',
        reason: 'Nearest deadline task. Completing this first minimizes grade risk and stress.',
        priority: 'High',
      },
      {
        task: unfinishedTasks[1]?.title || 'Practice past exam problem sets under timer',
        reason: 'High grade impact active recall session.',
        priority: 'High',
      },
      {
        task: unfinishedTasks[2]?.title || 'Light Concept Review & Note Organization',
        reason: 'Low effort session to maintain daily study momentum.',
        priority: 'Medium',
      },
    ];

    return {
      id: `plan-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      focusSubject: focusSub,
      missionTitle: `Focus: ${priorities[0].task}`,
      reasoning: priorities[0].reason,
      recommendedTasks: priorities.slice(0, Math.min(3, unfinishedTasks.length || 3)).map((p, idx) => ({
        id: `p-${idx + 1}`,
        subjectId: `sub-${idx}`,
        subjectName: unfinishedTasks[idx]?.subjectName || focusSub,
        title: p.task,
        estimatedMinutes: Math.min(45, Math.floor(minutes / 3)),
        priority: p.priority.toLowerCase() === 'high' ? 'high' : 'medium',
        completed: false,
      })),
      timeline: [
        {
          id: 'tb-1',
          timeRange: '09:00 AM - 09:45 AM',
          activity: priorities[0].task,
          subjectName: focusSub,
          completed: false,
        },
        {
          id: 'tb-2',
          timeRange: '10:00 AM - 10:45 AM',
          activity: priorities[1].task,
          subjectName: focusSub,
          completed: false,
        },
      ],
      totalEstimatedMinutes: minutes,
    };
  },
};
