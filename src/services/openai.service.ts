import { openai } from '../lib/openai';
import { memoryService } from './memory.service';
import { dbService } from './db.service';
import { scheduleService } from './schedule.service';
import type { ChatMessage } from '../types';

/**
 * Helper to parse relative or explicit dates from natural language text.
 */
function parseNaturalDate(text: string, defaultDaysAhead: number = 1): string {
  const lower = text.toLowerCase();
  const now = new Date();

  if (lower.includes('today')) {
    return now.toISOString();
  }
  if (lower.includes('tomorrow')) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d.toISOString();
  }
  if (lower.includes('day after tomorrow')) {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    return d.toISOString();
  }

  const inDaysMatch = lower.match(/in\s+(\d+)\s+days?/);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1], 10);
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  }

  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < daysOfWeek.length; i++) {
    const dayName = daysOfWeek[i];
    if (lower.includes(dayName)) {
      const targetDay = i;
      const currentDay = now.getDay();
      let diff = targetDay - currentDay;
      if (diff <= 0) diff += 7;
      const d = new Date(now);
      d.setDate(d.getDate() + diff);
      return d.toISOString();
    }
  }

  const fallbackDate = new Date(now);
  fallbackDate.setDate(fallbackDate.getDate() + defaultDaysAhead);
  return fallbackDate.toISOString();
}

export interface AIActionItem {
  actionType: 'add_task' | 'add_exam' | 'complete_task' | 'record_memory';
  title?: string;
  courseName?: string;
  dueDate?: string;
  examDate?: string;
  estimatedMinutes?: number;
  memoryType?: 'challenge' | 'preference' | 'goal' | 'habit' | 'subject_note';
  content?: string;
}

/**
 * True ChatGPT-Style AI Chief of Staff Service
 * Combines conversational intelligence with dynamic system action execution.
 */
export const openAIService = {
  /**
   * Main Chief of Staff Chat Processor like ChatGPT.
   */
  async processAdvisorChat(
    userMessage: string,
    history: ChatMessage[] = []
  ): Promise<{ responseText: string; actionSummary: string }> {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

    // 1. Assemble Student Memory & Context
    const context = await memoryService.assembleAcademicContext();

    const systemInstruction = `You are StudyOS, a high-intelligence AI Academic Chief of Staff (like ChatGPT for students).
Your goal is to converse naturally with the student while simultaneously identifying and extracting any academic actions they mention.

Current Student Academic Memory:
${context}

YOU MUST RETURN A VALID JSON OBJECT WITH EXACTLY THIS SCHEMA:
{
  "reply": "Your natural, empathetic ChatGPT response to the student.",
  "actions": [
    {
      "actionType": "add_task" | "add_exam" | "complete_task" | "record_memory",
      "title": "Clean Title",
      "courseName": "Subject Name",
      "estimatedMinutes": 45,
      "dueDate": "ISO Date String or relative description like tomorrow",
      "examDate": "ISO Date String or relative description like next Friday",
      "memoryType": "goal" | "challenge" | "habit" | "subject_note",
      "content": "Description of memory"
    }
  ]
}

Action Rules:
- If the user says they have a test/exam/quiz/midterm -> add an "add_exam" action with the subject and date.
- If the user says "study X", "need to read Y", "do Z", "write essay", "practice math", or mentions any task -> add an "add_task" action with clean title and duration.
- If the user says they finished or completed something -> add a "complete_task" action.
- If the user shares a struggle, goal, or habit -> add a "record_memory" action.
- If no specific action is needed, return "actions": [].
`;

    let aiReply = '';
    let executedActionsSummary: string[] = [];

    // 2. Try Google Gemini 2.0 Flash (100% Free) with Structured JSON Output
    if (geminiKey && !geminiKey.includes('your-gemini-api-key')) {
      try {
        const fullPrompt = `${systemInstruction}\n\nConversation History:\n${history.slice(-6).map((m) => `${m.role}: ${m.content}`).join('\n')}\n\nUser Message: ${userMessage}`;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            aiReply = parsed.reply || '';
            if (Array.isArray(parsed.actions)) {
              executedActionsSummary = await this.executeActions(parsed.actions, userMessage);
            }
          }
        }
      } catch (err) {
        console.warn('Gemini API call notice, trying OpenAI or smart fallback:', err);
      }
    }

    // 3. Try OpenAI GPT-4o-mini if available
    if (!aiReply && openaiKey && !openaiKey.includes('your-openai-api-key') && openaiKey !== 'placeholder-key') {
      try {
        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          { role: 'system', content: systemInstruction },
          ...history.slice(-6).map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          { role: 'user', content: userMessage },
        ];

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          response_format: { type: 'json_object' },
          temperature: 0.7,
        });

        const rawContent = completion.choices[0]?.message?.content;
        if (rawContent) {
          const parsed = JSON.parse(rawContent);
          aiReply = parsed.reply || '';
          if (Array.isArray(parsed.actions)) {
            executedActionsSummary = await this.executeActions(parsed.actions, userMessage);
          }
        }
      } catch (err) {
        console.warn('OpenAI API call notice, falling back to Smart Parser:', err);
      }
    }

    // 4. Smart Heuristic Fallback (If no API key or network error)
    if (!aiReply) {
      const fallbackResult = await this.executeFallbackHeuristic(userMessage);
      aiReply = fallbackResult.reply;
      executedActionsSummary = fallbackResult.summaryList;
    }

    // 5. Recalculate Today's Study Plan so Dashboard Today's Mission updates immediately
    try {
      await scheduleService.generateDailySchedule();
    } catch (e) {
      console.warn('Notice recalculating daily plan:', e);
    }

    const actionSummary = executedActionsSummary.length > 0
      ? executedActionsSummary.join(' | ')
      : "Recorded context in academic memory & updated Today's Study Plan.";

    return {
      responseText: aiReply,
      actionSummary,
    };
  },

  /**
   * Execute structured actions returned by AI LLM or Smart Fallback against Supabase.
   */
  async executeActions(actions: AIActionItem[], rawMessage: string): Promise<string[]> {
    const summaries: string[] = [];

    for (const act of actions) {
      if (act.actionType === 'add_task' && act.title) {
        const dueDate = parseNaturalDate(act.dueDate || rawMessage, 1);
        await dbService.addTask({
          title: act.title,
          courseName: act.courseName || 'General Study',
          dueDate,
          estimatedMinutes: act.estimatedMinutes || 45,
          priority: 'high',
        });
        summaries.push(`Added task "${act.title}"`);
      } else if (act.actionType === 'add_exam' && (act.title || act.courseName)) {
        const examTitle = act.title || `${act.courseName || 'General'} Exam`;
        const examDate = parseNaturalDate(act.examDate || rawMessage, 4);
        await dbService.addExam({
          title: examTitle,
          courseName: act.courseName || 'General Subject',
          examDate,
        });
        summaries.push(`Scheduled ${examTitle} for ${new Date(examDate).toLocaleDateString()}`);
      } else if (act.actionType === 'complete_task') {
        const snippet = act.title || 'assignment';
        await dbService.markTaskCompleteByTitle(snippet);
        summaries.push(`Marked task matching '${snippet}' completed`);
      } else if (act.actionType === 'record_memory' && act.content) {
        await dbService.addMemory(act.memoryType || 'subject_note', act.content);
        summaries.push(`Recorded memory note`);
      }
    }

    return summaries;
  },

  /**
   * Fallback Heuristic Engine when zero API keys are present.
   */
  async executeFallbackHeuristic(userMessage: string): Promise<{ reply: string; summaryList: string[] }> {
    const msg = userMessage.toLowerCase().trim();
    const summaries: string[] = [];
    let reply = '';

    // Test / Exam Detection
    if (msg.includes('test') || msg.includes('exam') || msg.includes('quiz') || msg.includes('midterm')) {
      let subject = 'General Subject';
      if (msg.includes('chem') || msg.includes('chemistry')) subject = 'Chemistry';
      else if (msg.includes('calc') || msg.includes('math') || msg.includes('calculus')) subject = 'Calculus';
      else if (msg.includes('bio') || msg.includes('biology')) subject = 'Biology';
      else if (msg.includes('history')) subject = 'History';
      else if (msg.includes('physics')) subject = 'Physics';

      const examDate = parseNaturalDate(userMessage, 4);
      const title = `${subject} Exam`;

      await dbService.addExam({ title, courseName: subject, examDate });
      summaries.push(`Scheduled ${title} for ${new Date(examDate).toLocaleDateString()}`);
      reply = `I understand you have an upcoming ${subject} test on ${new Date(examDate).toLocaleDateString()}! I've added it to your academic calendar and prioritized review sessions in Today's Study Plan.`;
    }
    // Completed Task Detection
    else if (msg.includes('finished') || msg.includes('completed') || msg.includes('done with') || msg.includes('turned in')) {
      let snippet = 'assignment';
      if (msg.includes('essay')) snippet = 'essay';
      else if (msg.includes('homework')) snippet = 'homework';
      else if (msg.includes('lab')) snippet = 'lab';

      await dbService.markTaskCompleteByTitle(snippet);
      summaries.push(`Marked '${snippet}' complete`);
      reply = `Great job completing your ${snippet}! I've updated your backlog and recalculated your remaining study load for today.`;
    }
    // Study / Task Detection
    else {
      let subject = 'General Study';
      if (msg.includes('chem') || msg.includes('chemistry')) subject = 'Chemistry';
      else if (msg.includes('calc') || msg.includes('math') || msg.includes('calculus')) subject = 'Calculus';
      else if (msg.includes('bio') || msg.includes('biology')) subject = 'Biology';
      else if (msg.includes('history')) subject = 'History';
      else if (msg.includes('physics')) subject = 'Physics';

      const title = userMessage.charAt(0).toUpperCase() + userMessage.slice(1);
      const dueDate = parseNaturalDate(userMessage, 1);

      await dbService.addTask({
        title,
        courseName: subject,
        dueDate,
        estimatedMinutes: 45,
        priority: 'high',
      });
      summaries.push(`Added task "${title}"`);
      reply = `Got it! I've logged "${title}" into your workload backlog and scheduled it in Today's Study Plan so you can start right away.`;
    }

    await memoryService.recordMemory('subject_note', `Student note: "${userMessage}"`);
    return { reply, summaryList: summaries };
  },
};
