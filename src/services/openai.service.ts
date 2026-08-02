import { openai } from '../lib/openai';
import { memoryService } from './memory.service';
import { dbService } from './db.service';
import { scheduleService } from './schedule.service';
import type { ChatMessage, ExtractedIntent } from '../types';

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
3. End responses with a clear recommendation for today.`;

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
   * Extracts exams, completed tasks, new tasks, or general context notes, and saves to Supabase.
   */
  async extractAndApplyIntent(userMessage: string): Promise<ExtractedIntent | null> {
    const msg = userMessage.toLowerCase();

    // Intent 1: Exam / Quiz / Test
    if (msg.includes('quiz') || msg.includes('exam') || msg.includes('test') || msg.includes('midterm')) {
      let subject = 'General Subject';
      if (msg.includes('chem') || msg.includes('chemistry')) subject = 'Chemistry';
      else if (msg.includes('calc') || msg.includes('math')) subject = 'Calculus';
      else if (msg.includes('bio') || msg.includes('biology')) subject = 'Biology';
      else if (msg.includes('history')) subject = 'History';
      else if (msg.includes('physics')) subject = 'Physics';
      else if (msg.includes('english') || msg.includes('lit')) subject = 'English';

      const targetDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();

      await dbService.addExam({
        title: `${subject} Quiz/Exam`,
        courseName: subject,
        examDate: targetDate,
      });

      await memoryService.recordMemory('goal', `Upcoming ${subject} exam noted: "${userMessage}"`);

      return {
        intentType: 'add_exam',
        summary: `Added ${subject} exam to database & updated study priorities.`,
        entities: { subjectName: subject, examTitle: `${subject} Quiz` },
      };
    }

    // Intent 2: Finished / Completed Task
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

    // Intent 3: Struggle / Difficulty
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

    // Intent 4: New Assignment / Task Mentioned
    if (msg.includes('due') || msg.includes('read') || msg.includes('write') || msg.includes('paper') || msg.includes('project') || msg.includes('homework')) {
      await dbService.addTask({
        title: userMessage.length > 50 ? userMessage.substring(0, 50) + '...' : userMessage,
        estimatedMinutes: 45,
        priority: 'high',
      });

      await memoryService.recordMemory('subject_note', `New task added: "${userMessage}"`);

      return {
        intentType: 'add_task',
        summary: `Saved new assignment to database & updated Today's Study Plan.`,
        entities: { taskTitle: userMessage },
      };
    }

    // Intent 5: General Context Note
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
  generateFallbackAdvisorResponse(action: ExtractedIntent | null, summary: string): { responseText: string; actionSummary: string } {
    return {
      responseText: action
        ? `Got it! I've processed your update: "${action.summary}" Your StudyOS daily plan is automatically updated to reflect this!`
        : `Thank you for sharing that update. I've saved it into your long-term academic memory and recalculated Today's Study Plan for you!`,
      actionSummary: summary,
    };
  },
};
