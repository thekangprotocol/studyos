import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../services/db.service';
import { memoryService } from '../services/memory.service';
import { scheduleService } from '../services/schedule.service';
import { Sparkles, ArrowRight, Loader2, Compass } from 'lucide-react';

interface OnboardingChatProps {
  onComplete: () => void;
}

interface StepQuestion {
  key: string;
  question: string;
  placeholder: string;
}

const ONBOARDING_QUESTIONS: StepQuestion[] = [
  {
    key: 'gradeLevel',
    question: "First, what grade or year in school are you currently in?",
    placeholder: "e.g. High School Senior, College Sophomore, 11th Grade...",
  },
  {
    key: 'schoolName',
    question: "What school do you attend? (Optional)",
    placeholder: "e.g. Stanford University, Lincoln High, or press Skip...",
  },
  {
    key: 'courses',
    question: "What classes or subjects are you taking this term?",
    placeholder: "e.g. Calculus II, CS 101, Physics, Organic Chemistry...",
  },
  {
    key: 'assignments',
    question: "What major assignments or homework tasks are currently due?",
    placeholder: "e.g. CS 101 Recursion Lab, Calculus Problem Set 4...",
  },
  {
    key: 'exams',
    question: "What exams, midterms, or quizzes are coming up soon?",
    placeholder: "e.g. Chemistry Quiz on Friday, Calculus Midterm next week...",
  },
  {
    key: 'difficulties',
    question: "Which of your subjects do you find most difficult or stressful?",
    placeholder: "e.g. Calculus II and Organic Chemistry mechanisms...",
  },
  {
    key: 'availableHours',
    question: "How many hours can you usually dedicate to studying each day?",
    placeholder: "e.g. 3 hours, 4 hours, 2.5 hours...",
  },
  {
    key: 'preferredTimes',
    question: "What times of day are you normally available to study?",
    placeholder: "e.g. Mornings 9-12 AM, Evenings 7-10 PM...",
  },
  {
    key: 'targetGrades',
    question: "What grades or GPA are you hoping to achieve this semester?",
    placeholder: "e.g. Straight A's, 3.8+ GPA, B+ or higher...",
  },
  {
    key: 'procrastination',
    question: "Finally, what usually causes you to procrastinate or get stuck?",
    placeholder: "e.g. Overwhelm starting large papers, phone notifications...",
  },
];

export const OnboardingChat: React.FC<OnboardingChatProps> = ({ onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'assistant' | 'user'; content: string }>>([
    {
      role: 'assistant',
      content: "Welcome to StudyOS! I'm your AI Academic Chief of Staff. " + ONBOARDING_QUESTIONS[0].question,
    },
  ]);
  const [isFinishing, setIsFinishing] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isFinishing]);

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    const answer = inputVal.trim();
    if (!answer && currentStepIndex !== 1) return;

    const currentQ = ONBOARDING_QUESTIONS[currentStepIndex];

    const updatedMessages = [
      ...messages,
      { role: 'user' as const, content: answer || '(Skipped)' },
    ];

    setInputVal('');

    await saveStepData(currentQ.key, answer);

    const nextIndex = currentStepIndex + 1;

    if (nextIndex < ONBOARDING_QUESTIONS.length) {
      setCurrentStepIndex(nextIndex);
      setMessages([
        ...updatedMessages,
        { role: 'assistant' as const, content: ONBOARDING_QUESTIONS[nextIndex].question },
      ]);
    } else {
      setIsFinishing(true);
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant' as const,
          content: "Thank you! I've built your academic profile and memory. Generating Today's Study Plan for you now...",
        },
      ]);

      await dbService.updateUserProfile({ onboardingCompleted: true });
      await scheduleService.generateDailySchedule();

      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  };

  const saveStepData = async (key: string, answer: string) => {
    if (!answer) return;

    try {
      if (key === 'gradeLevel') {
        await dbService.updateUserProfile({ gradeLevel: answer });
      } else if (key === 'schoolName') {
        await dbService.updateUserProfile({ schoolName: answer });
      } else if (key === 'courses') {
        const classList = answer.split(/[,;\n]/).map((c) => c.trim()).filter(Boolean);
        for (const className of classList) {
          await dbService.addCourse(className);
        }
      } else if (key === 'assignments') {
        await dbService.addTask({ title: answer, estimatedMinutes: 60, priority: 'high' });
      } else if (key === 'exams') {
        await dbService.addExam({ title: answer, courseName: 'General', examDate: new Date(Date.now() + 4 * 86400000).toISOString() });
      } else if (key === 'difficulties') {
        await memoryService.recordMemory('challenge', `Difficult subjects: ${answer}`);
      } else if (key === 'availableHours') {
        const hoursNum = parseFloat(answer) || 3.0;
        await dbService.updateUserProfile({ dailyAvailableHours: hoursNum });
      } else if (key === 'preferredTimes') {
        await dbService.updateUserProfile({ preferredStudyTimes: answer });
      } else if (key === 'targetGrades') {
        await dbService.updateUserProfile({ targetGrades: answer });
      } else if (key === 'procrastination') {
        await dbService.updateUserProfile({ procrastinationTriggers: answer });
        await memoryService.recordMemory('habit', `Procrastination triggers: ${answer}`);
      }
    } catch (err) {
      console.warn(`Error saving onboarding step [${key}]:`, err);
    }
  };

  const currentQ = ONBOARDING_QUESTIONS[currentStepIndex];

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 text-xs">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold uppercase tracking-wider">
          <Compass className="w-4 h-4" />
          <span>Step {Math.min(currentStepIndex + 1, 10)} of 10</span>
        </div>
        <span className="text-zinc-500 font-mono">
          {Math.round(((currentStepIndex + 1) / 10) * 100)}% Complete
        </span>
      </div>

      <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-1">
                <Sparkles className="w-4 h-4" />
              </div>
            )}
            <div
              className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-black border border-zinc-800 text-zinc-200 shadow-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isFinishing && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-800/60 rounded-2xl text-emerald-300 text-xs flex items-center gap-3 animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400 shrink-0" />
            <span>Building student memory & constructing today's study plan...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {!isFinishing && (
        <form onSubmit={handleNextStep} className="space-y-3 pt-2">
          <div className="relative">
            <input
              type="text"
              required={currentStepIndex !== 1}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={currentQ?.placeholder || 'Type your answer...'}
              className="w-full pl-4 pr-12 py-3.5 bg-black border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-md"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex justify-between items-center text-[11px] text-zinc-500 px-1">
            <span>Press Enter to submit</span>
            {currentStepIndex === 1 && (
              <button
                type="button"
                onClick={() => setInputVal('Skipped')}
                className="text-indigo-400 hover:underline"
              >
                Skip optional question
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};
