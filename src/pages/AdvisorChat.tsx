import React, { useState, useEffect, useRef } from 'react';
import { Container } from '../components/Container';
import { dbService } from '../services/db.service';
import { openAIService } from '../services/openai.service';
import type { ChatMessage, StudentMemory } from '../types';
import { Compass, Sparkles, Send, Loader2, CheckCircle2, User, Database, BrainCircuit, RefreshCw, Zap } from 'lucide-react';

export const AdvisorChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [memories, setMemories] = useState<StudentMemory[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showMemoryDrawer, setShowMemoryDrawer] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadChatHistory = async () => {
    setInitialLoading(true);
    const history = await dbService.getRecentMessages(30);
    const mems = await dbService.getMemories();
    setMemories(mems);

    if (history.length === 0) {
      const initialMessage: ChatMessage = {
        id: 'msg-welcome',
        role: 'assistant',
        content: "I'm your AI Academic Chief of Staff. You can type commands like 'study biology' or 'study calculus for 60m', report finished tasks, or log upcoming exams. Every message automatically updates your academic memory and recalculates your daily study plan.",
      };
      setMessages([initialMessage]);
    } else {
      setMessages(history);
    }
    setInitialLoading(false);
  };

  const handleSendMessageText = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    await dbService.saveMessage('user', text);

    try {
      const { responseText, actionSummary } = await openAIService.processAdvisorChat(text, messages);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: responseText,
        metadata: { actionSummary },
      };

      setMessages((prev) => [...prev, aiMsg]);
      await dbService.saveMessage('assistant', responseText, aiMsg.metadata);

      const updatedMems = await dbService.getMemories();
      setMemories(updatedMems);
    } catch (err) {
      console.error('Advisor chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessageText(inputVal);
  };

  return (
    <main className="py-8 sm:py-12 pb-24 text-zinc-900 dark:text-zinc-100 bg-white dark:bg-black min-h-[calc(100vh-80px)] flex flex-col transition-colors">
      <Container>
        <div className="max-w-3xl mx-auto space-y-6 flex-1 flex flex-col">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-900 pb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black text-white dark:bg-white dark:text-black rounded-xl shadow-sm">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-black dark:text-white tracking-tight font-heading">AI Chief of Staff</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Type 'study ______' to instantly log & schedule study tasks</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMemoryDrawer(!showMemoryDrawer)}
                className="text-xs font-bold text-black dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 transition-colors"
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>{memories.length} Memories Stored</span>
              </button>

              <span className="text-xs font-bold text-black dark:text-white bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-black dark:bg-white animate-ping" />
                Live Plan Sync
              </span>
            </div>
          </div>

          {/* MEMORY DRAWER MODAL */}
          {showMemoryDrawer && (
            <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-3xl p-4 sm:p-6 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span>Student Academic Memory Database ({memories.length})</span>
                </h4>
                <button
                  onClick={() => setShowMemoryDrawer(false)}
                  className="text-xs text-zinc-500 hover:text-black dark:hover:text-white font-bold px-2 py-1"
                >
                  Close
                </button>
              </div>

              {memories.length === 0 ? (
                <p className="text-xs text-zinc-500 py-2">No memories recorded yet. Start chatting below!</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {memories.map((m) => (
                    <div key={m.id} className="p-2.5 bg-white dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs flex items-start gap-2 shadow-sm">
                      <span className="text-[10px] font-mono font-bold uppercase bg-black text-white dark:bg-white dark:text-black px-2 py-0.5 rounded shrink-0">
                        {m.memoryType}
                      </span>
                      <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed font-semibold">{m.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chat Container */}
          <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex-1 flex flex-col justify-between min-h-[450px]">
            {/* Messages log */}
            <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 flex-1">
              {initialLoading ? (
                <div className="py-12 text-center text-zinc-500 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-black dark:text-white mx-auto" />
                  <p className="text-xs font-semibold">Loading academic context & chat memory...</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shrink-0 mt-1 shadow-sm">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}

                    <div className="space-y-1.5 max-w-[85%]">
                      <div
                        className={`p-4 rounded-2xl text-sm leading-relaxed font-medium ${
                          msg.role === 'user'
                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-md'
                            : 'bg-white text-black border border-zinc-200 dark:bg-black dark:border-zinc-800 dark:text-zinc-100 shadow-sm'
                        }`}
                      >
                        {msg.content}
                      </div>

                      {msg.metadata?.actionSummary && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black text-[11px] font-bold shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>⚡ {msg.metadata.actionSummary}</span>
                        </div>
                      )}
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white flex items-center justify-center shrink-0 mt-1">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))
              )}

              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shrink-0 mt-1">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="p-4 rounded-2xl text-sm bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-black dark:text-white flex items-center gap-2 animate-pulse font-bold">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting 'study _____' command, saving memory & updating Today's Study Plan...</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Quick Action Suggestion Chips for 'study ______' */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80 mt-4 space-y-3">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 shrink-0">Quick Commands:</span>
                {[
                  'study biology',
                  'study calculus for 60m',
                  'study physics chapter 4',
                  'study history presentation',
                ].map((cmd) => (
                  <button
                    key={cmd}
                    type="button"
                    onClick={() => handleSendMessageText(cmd)}
                    className="px-3 py-1 bg-white text-black dark:bg-black dark:text-white border border-zinc-200 dark:border-zinc-800 rounded-full font-bold hover:border-black dark:hover:border-white transition-all shrink-0 flex items-center gap-1 shadow-sm"
                  >
                    <Zap className="w-3 h-3 text-zinc-400" />
                    <span>"{cmd}"</span>
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form onSubmit={handleFormSubmit} className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="Type 'study biology', 'study math for 1 hour', 'read chapter 4'..."
                    className="w-full pl-4 pr-12 py-3.5 bg-white text-black dark:bg-black dark:text-white border border-zinc-300 dark:border-zinc-800 rounded-xl text-sm placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition-all font-medium"
                  />
                  <button
                    type="submit"
                    disabled={loading || !inputVal.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black text-white dark:bg-white dark:text-black rounded-lg transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1 font-semibold">
                  <span>Type 'study _____' to automatically add tasks & schedule your day</span>
                  <span>Press Enter to send</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
};
