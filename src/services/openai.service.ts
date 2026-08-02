import { openai } from '../lib/openai';
import { memoryService } from './memory.service';
import { dbService } from './db.service';
import { scheduleService } from './schedule.service';
import type { ChatMessage, ExtractedIntent } from '../types';

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

  // Parse "in N days"
  const inDaysMatch = lower.match(/in\s+(\d+)\s+days?/);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1], 10);
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  }

  // Parse days of the week
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < daysOfWeek.length; i++) {
    const dayName = daysOfWeek[i];
    if (lower.includes(dayName)) {
      const targetDay = i;
      const currentDay = now.getDay();
      let diff = targetDay - currentDay;
      if (diff <= 0) diff += 7; // Target upcoming occurrence of this weekday
      const d = new Date(now);
      d.setDate(d.getDate() + diff);
      return d.toISOString();
    }
  }

  // Default fallback
  const fallbackDate = new Date(now);
  fallbackDate.setDate(fallbackDate.getDate() + defaultDaysAhead);
  return fallbackDate.toISOString();
}

/**
 * AI Service for Chief of Staff
 * Supports Google Gemini (100% Free), Groq (100% Free), OpenAI, and Smart Heuristic Engine.
 */
export const openAIService = {
  /**
   * Main Chief of Staff AI Response Generator with Automatic Intent Extraction & Recalculation.
   */
  async processAdvisorChat(
    userMessage: string,
    history: ChatMessage[] = []
  ): Promise<{ responseText: string; actionSummary: string }> {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

    // 1. Automatically parse and extract intent + update Supabase database
    const extractedAction = await this.extractAndApplyIntent(userMessage);

    // 2. Recalculate Today's Study Plan immediately so Today's Mission is updated
    try {
      await scheduleService.generateDailySchedule();
    } catch (e) {
      console.warn('Notice recalculating daily plan after chat message:', e);
    }

    const actionSummary = extractedAction
      ? extractedAction.summary
      : "Recorded context in academic memory & updated Today's Study Plan.";

    // 3. Try Google Gemini 2.0 Flash (100% FREE Tier)
    if (geminiKey && !geminiKey.includes('your-gemini-api-key')) {
      try {
        const context = await memoryService.assembleAcademicContext();
        const systemPrompt = `You are StudyOS, an elite AI Academic Chief of Staff.
Your role is to understand the student's academic life, reduce their cognitive load, maximize their GPA, and minimize their stress.
Act as a thoughtful, proactive long-term academic advisor — NOT a generic chatbot.

Current Student Context & Memory:
${context}

Directives:
1. Keep responses concise, encouraging, and structured.
2. Acknowledge that you have recorded their update into their StudyOS system and updated today's study plan.
3. Confirm specifically what task or exam was extracted and scheduled for them.
4. End responses with a clear recommendation for today.`;

        const fullPrompt = `${systemPrompt}\n\nConversation History:\n${history.slice(-6).map((m) => `${m.role}: ${m.content}`).join('\n')}\n\nUser: ${userMessage}`;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) {
            return {
              responseText,
              actionSummary,
            };
          }
        }
      } catch (err) {
        console.warn('Gemini API call notice, trying next provider or fallback:', err);
      }
    }

    // 4. Try OpenAI if API key provided
    if (openaiKey && !openaiKey.includes('your-openai-api-key') && openaiKey !== 'placeholder-key') {
      try {
        const context = await memoryService.assembleAcademicContext();
        const systemPrompt = `You are StudyOS, an elite AI Academic Chief of Staff.
Your role is to understand the student's academic life, reduce their cognitive load, maximize their GPA, and minimize their stress.

Current Student Context & Memory:
${context}`;

        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          { role: 'system', content: systemPrompt },
          ...history.slice(-6).map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          { role: 'user', content: userMessage },
        ];

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
        });

        const responseText = completion.choices[0]?.message?.content;
        if (responseText) {
          return {
            responseText,
            actionSummary,
          };
        }
      } catch (err) {
        console.warn('OpenAI API call notice, switching to Smart Heuristic Engine:', err);
      }
    }

    // 5. Default 100% Free Smart Heuristic Engine (Zero API Keys Required)
    return this.generateFallbackAdvisorResponse(extractedAction, actionSummary);
  },

  /**
   * Universal intent & entity parser.
   * Extracts exams, quizzes, completed tasks, general tasks ("must read", "have a test", "do this"), and saves to Supabase with ACCURATE DATES.
   */
  async extractAndApplyIntent(userMessage: string): Promise<ExtractedIntent | null> {
    const msg = userMessage.toLowerCase().trim();

    // 1. EXAM / TEST / QUIZ / MIDTERM INTENT
    if (msg.includes('quiz') || msg.includes('exam') || msg.includes('test') || msg.includes('midterm')) {
      let subject = 'General Subject';
      if (msg.includes('chem') || msg.includes('chemistry')) subject = 'Chemistry';
      else if (msg.includes('calc') || msg.includes('math') || msg.includes('calculus')) subject = 'Calculus';
      else if (msg.includes('bio') || msg.includes('biology')) subject = 'Biology';
      else if (msg.includes('history')) subject = 'History';
      else if (msg.includes('physics')) subject = 'Physics';
      else if (msg.includes('english') || msg.includes('lit')) subject = 'English';

      // Accurately parse target date from text
      const targetDate = parseNaturalDate(userMessage, 4);

      const examTitle = userMessage.length > 40
        ? `${subject} Test`
        : userMessage.charAt(0).toUpperCase() + userMessage.slice(1);

      await dbService.addExam({
        title: examTitle,
        courseName: subject,
        examDate: targetDate,
      });

      await memoryService.recordMemory('goal', `Upcoming exam noted for ${new Date(targetDate).toLocaleDateString()}: "${userMessage}"`);

      return {
        intentType: 'add_exam',
        summary: `Added ${examTitle} (Date: ${new Date(targetDate).toLocaleDateString()}) to database & updated study priorities.`,
        entities: { subjectName: subject, examTitle, examDate: targetDate },
      };
    }

    // 2. COMPLETED / FINISHED TASK INTENT
    if (msg.includes('finished') || msg.includes('completed') || msg.includes('done with') || msg.includes('turned in')) {
      let taskSnippet = 'assignment';
      if (msg.includes('essay')) taskSnippet = 'essay';
      else if (msg.includes('homework')) taskSnippet = 'homework';
      else if (msg.includes('problem set')) taskSnippet = 'problem set';
      else if (msg.includes('lab')) taskSnippet = 'lab';
      else if (msg.includes('reading') || msg.includes('chapter')) taskSnippet = 'reading';

      await dbService.markTaskCompleteByTitle(taskSnippet);
      await memoryService.recordMemory('habit', `Completed: "${userMessage}"`);

      return {
        intentType: 'complete_task',
        summary: `Marked assignment matching '${taskSnippet}' as completed in database.`,
        entities: { taskTitle: taskSnippet },
      };
    }

    // 3. STRUGGLE / DIFFICULTY INTENT
    if (msg.includes('struggling') || msg.includes('hard time') || msg.includes('confused') || msg.includes('trouble') || msg.includes('hate')) {
      let subject = 'Calculus';
      if (msg.includes('calc') || msg.includes('calculus')) subject = 'Calculus';
      else if (msg.includes('physics')) subject = 'Physics';
      else if (msg.includes('chem')) subject = 'Chemistry';
      else if (msg.includes('bio')) subject = 'Biology';

      await dbService.addMemory('challenge', `Student difficulty note: "${userMessage}"`);

      return {
        intentType: 'update_challenge',
        summary: `Recorded academic challenge for ${subject} & prioritized practice session.`,
        entities: { subjectName: subject, challengeNote: userMessage },
      };
    }

    // 4. GENERAL TASK / ACTION INTENT ("must read", "do this", "need to write", "study _____", "have to finish", etc.)
    const isTaskKeyword =
      msg.includes('study') ||
      msg.includes('read') ||
      msg.includes('do ') ||
      msg.includes('must ') ||
      msg.includes('need to') ||
      msg.includes('have to') ||
      msg.includes('write') ||
      msg.includes('paper') ||
      msg.includes('homework') ||
      msg.includes('project') ||
      msg.includes('lab') ||
      msg.includes('problem set') ||
      msg.includes('review') ||
      msg.includes('practice') ||
      msg.includes('due');

    if (isTaskKeyword || msg.length > 5) {
      // Extract subject course name if present
      let courseName = 'General Study';
      if (msg.includes('chem') || msg.includes('chemistry')) courseName = 'Chemistry';
      else if (msg.includes('calc') || msg.includes('math') || msg.includes('calculus')) courseName = 'Calculus';
      else if (msg.includes('bio') || msg.includes('biology')) courseName = 'Biology';
      else if (msg.includes('history')) courseName = 'History';
      else if (msg.includes('physics')) courseName = 'Physics';
      else if (msg.includes('english') || msg.includes('lit')) courseName = 'English';

      // Parse accurate due date
      const dueDate = parseNaturalDate(userMessage, 1);

      // Clean task title
      const cleanTitle = userMessage.charAt(0).toUpperCase() + userMessage.slice(1);

      await dbService.addTask({
        title: cleanTitle,
        courseName,
        dueDate,
        estimatedMinutes: 45,
        priority: 'high',
      });

      await memoryService.recordMemory('subject_note', `Task added for ${new Date(dueDate).toLocaleDateString()}: "${cleanTitle}"`);

      return {
        intentType: 'add_task',
        summary: `Added "${cleanTitle}" (Due: ${new Date(dueDate).toLocaleDateString()}) to database & updated Today's Study Plan.`,
        entities: { subjectName: courseName, taskTitle: cleanTitle },
      };
    }

    // 5. General Fallback Context Note
    await memoryService.recordMemory('subject_note', `Student context note: "${userMessage}"`);
    return {
      intentType: 'general_chat',
      summary: `Saved update to student memory & recalculated study plan.`,
      entities: {},
    };
  },

  /**
   * Resilient fallback advisor response.
   */
  generateFallbackAdvisorResponse(
    action: ExtractedIntent | null,
    summary: string
  ): { responseText: string; actionSummary: string } {
    if (action && action.entities?.taskTitle) {
      return {
        responseText: `I've added "${action.entities.taskTitle}" directly to your task backlog! I also recalculated Today's Study Plan so you can start right away on your Dashboard.`,
        actionSummary: summary,
      };
    }

    if (action && action.entities?.examTitle) {
      return {
        responseText: `I've recorded your ${action.entities.examTitle} in your academic calendar and adjusted your daily preparation schedule!`,
        actionSummary: summary,
      };
    }

    return {
      responseText: action
        ? `Got it! I've processed your update: "${action.summary}" Your StudyOS daily plan is automatically updated to reflect this!`
        : `Thank you for sharing that update. I've saved it into your long-term academic memory and recalculated Today's Study Plan for you!`,
      actionSummary: summary,
    };
  },
};
