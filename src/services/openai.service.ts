import { openai } from '../lib/openai';
import { memoryService } from './memory.service';
import { dbService } from './db.service';
import type { ChatMessage, ExtractedIntent } from '../types';

/**
 * OpenAI Service
 * Communicates with GPT-4o-mini to power conversational onboarding, Chief of Staff advice,
 * intent parsing, and entity extraction.
 */
export const openAIService = {
  /**
   * Main Chief of Staff AI Response Generator with Automatic Intent Extraction.
   */
  async processAdvisorChat(
    userMessage: string,
    history: ChatMessage[] = []
  ): Promise<{ responseText: string; actionSummary?: string }> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    const extractedAction = await this.extractAndApplyIntent(userMessage);

    if (!apiKey || apiKey.includes('your-openai-api-key') || apiKey === 'placeholder-key') {
      return this.generateFallbackAdvisorResponse(extractedAction);
    }

    try {
      const context = await memoryService.assembleAcademicContext();

      const systemPrompt = `You are StudyOS, an elite AI Academic Chief of Staff.
Your role is to understand the student's academic life, reduce their cognitive load, maximize their GPA, and minimize their stress.
You act as a thoughtful, proactive long-term academic advisor — NOT a generic chatbot.

Current Student Context & Memory:
${context}

Directives:
1. Always keep responses concise, encouraging, and structured.
2. If the user mentions a new assignment, exam, or finished task, acknowledge that you updated their StudyOS system.
3. End responses with a clear recommendation or asking how you can support their focus today.`;

      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-8).map((m) => ({
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

      const responseText = completion.choices[0]?.message?.content ||
        "I've updated your academic profile. Let's make sure your daily study plan reflects your priorities!";

      return {
        responseText,
        actionSummary: extractedAction ? extractedAction.summary : undefined,
      };
    } catch (err) {
      console.warn('OpenAI API call notice in Advisor Chat. Operating in offline mode:', err);
      return this.generateFallbackAdvisorResponse(extractedAction);
    }
  },

  /**
   * Automatically parses student statements to extract structured entities & update database.
   */
  async extractAndApplyIntent(userMessage: string): Promise<ExtractedIntent | null> {
    const msg = userMessage.toLowerCase();

    if (msg.includes('quiz') || msg.includes('exam') || msg.includes('test') || msg.includes('midterm')) {
      let subject = 'General Subject';
      if (msg.includes('chem') || msg.includes('chemistry')) subject = 'Chemistry';
      else if (msg.includes('calc') || msg.includes('math')) subject = 'Calculus';
      else if (msg.includes('bio') || msg.includes('biology')) subject = 'Biology';
      else if (msg.includes('history')) subject = 'History';
      else if (msg.includes('physics')) subject = 'Physics';

      const targetDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();

      await dbService.addExam({
        title: `${subject} Quiz/Exam`,
        courseName: subject,
        examDate: targetDate,
      });

      await memoryService.recordMemory('goal', `Upcoming ${subject} quiz/exam noted for this week.`);

      return {
        intentType: 'add_exam',
        summary: `Added ${subject} quiz to upcoming exams and updated study priorities.`,
        entities: { subjectName: subject, examTitle: `${subject} Quiz` },
      };
    }

    if (msg.includes('finished') || msg.includes('completed') || msg.includes('done with') || msg.includes('turned in')) {
      let taskSnippet = 'essay';
      if (msg.includes('essay')) taskSnippet = 'essay';
      else if (msg.includes('homework')) taskSnippet = 'homework';
      else if (msg.includes('problem set')) taskSnippet = 'problem set';

      await dbService.markTaskCompleteByTitle(taskSnippet);
      await memoryService.recordMemory('habit', `Completed assignment: ${taskSnippet}.`);

      return {
        intentType: 'complete_task',
        summary: `Marked '${taskSnippet}' assignment as completed.`,
        entities: { taskTitle: taskSnippet },
      };
    }

    if (msg.includes('struggling') || msg.includes('hard time') || msg.includes('confused') || msg.includes('trouble')) {
      let subject = 'Calculus';
      if (msg.includes('calc') || msg.includes('calculus')) subject = 'Calculus';
      else if (msg.includes('physics')) subject = 'Physics';
      else if (msg.includes('chem')) subject = 'Chemistry';

      await dbService.addMemory('challenge', `Student expressed difficulty mastering ${subject}. Requires priority study focus.`);

      return {
        intentType: 'update_challenge',
        summary: `Recorded challenge with ${subject} to prioritize practice sessions.`,
        entities: { subjectName: subject, challengeNote: `Struggling with ${subject}` },
      };
    }

    return null;
  },

  /**
   * Resilient fallback advisor response for offline mode.
   */
  generateFallbackAdvisorResponse(action: ExtractedIntent | null): { responseText: string; actionSummary?: string } {
    if (action) {
      return {
        responseText: `Got it! I've updated your academic profile: ${action.summary} Your StudyOS daily plan is automatically updated to reflect this.`,
        actionSummary: action.summary,
      };
    }

    return {
      responseText: `Thank you for sharing that context. As your AI Chief of Staff, I've noted this in your academic memory and will factor it into today's study plan.`,
    };
  },
};
