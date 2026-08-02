import React, { useState, useEffect, useRef } from 'react';
import { Container } from '../components/Container';
import { dbService } from '../services/db.service';
import { openAIService } from '../services/openai.service';
import type { ChatMessage, StudentMemory } from '../types';
import { Compass, Sparkles, Send, Loader2, CheckCircle2, User, Database, BrainCircuit, RefreshCw } from 'lucide-react';

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
        content: "I'm your AI Academic Chief of Staff. You can tell me about upcoming quizzes, assignments you've finished, or subjects you're struggling with. Every message automatically updates your academic memory and recalculates your daily study plan.",
      };
      setMessages([initialMessage]);
    } else {
      setMessages(history);
    }
    setInitialLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputVal.trim();
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

      // Refresh student memories list
      const updatedMems = await dbService.getMemories();
      setMemories(updatedMems);
    } catch (err) {
      console.error('Advisor chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="py-8 sm:py-12 pb-24 text-zinc-100 bg-black min-h-[calc(100vh-80px)] flex flex-col">
      <Container>
        <div className="max-w-3xl mx-auto space-y-6 flex-1 flex flex-col">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-zinc-900 pb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">AI Chief of Staff</h2>
                <p className="text-xs text-zinc-400">Long-Term Academic Advisor & Memory Interface</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMemoryDrawer(!showMemoryDrawer)}
                className="text-xs font-semibold text-indigo-300 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-800 flex items-center gap-1.5 transition-colors"
              >
                <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
                <span>{memories.length} Memories Stored</span>
              </button>

              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Plan Sync
              </span>
            </div>
          </div>

          {/* MEMORY DRAWER MODAL / BOX */}
          {showMemoryDrawer && (
            <div className="bg-zinc-900/90 border border-indigo-500/30 rounded-2xl p-4 sm:p-6 space-y-3 backdrop-blur-xl shadow-xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span>Student Academic Memory Database ({memories.length})</span>
                </h4>
                <button
                  onClick={() => setShowMemoryDrawer(false)}
                  className="text-xs text-zinc-400 hover:text-white px-2 py-1"
                >
                  Close
                </button>
              </div>

              {memories.length === 0 ? (
                <p className="text-xs text-zinc-500 py-2">No memories recorded yet. Start chatting below!</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {memories.map((m) => (
                    <div key={m.id} className="p-2.5 bg-black/60 rounded-xl border border-zinc-800/80 text-xs flex items-start gap-2">
                      <span className="text-[10px] font-mono uppercase bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/40 shrink-0">
                        {m.memoryType}
                      </span>
                      <p className="text-zinc-300 leading-relaxed font-medium">{m.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chat Container */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex-1 flex flex-col justify-between min-h-[450px]">
            {/* Messages log */}
            <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 flex-1">
              {initialLoading ? (
                <div className="py-12 text-center text-zinc-500 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
                  <p className="text-xs">Loading academic context & chat memory...</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-1">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}

                    <div className="space-y-1.5 max-w-[85%]">
                      <div
                        className={`p-4 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-black border border-zinc-800 text-zinc-200 shadow-sm'
                        }`}
                      >
                        {msg.content}
                      </div>

                      {/* Action notification badge */}
                      {msg.metadata?.actionSummary && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/90 border border-emerald-800/80 text-emerald-300 text-[11px] font-semibold shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>⚡ {msg.metadata.actionSummary}</span>
                        </div>
                      )}
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center shrink-0 mt-1">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))
              )}

              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-1">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  </div>
                  <div className="p-4 rounded-2xl text-sm bg-black border border-zinc-800 text-indigo-300 flex items-center gap-2 animate-pulse font-medium">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>Extracting entities, saving memory & recalculating Today's Study Plan...</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="pt-4 border-t border-zinc-800/80 mt-4 space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="e.g. 'I have a chemistry quiz Friday', 'Read chapter 4 of biology'..."
                  className="w-full pl-4 pr-12 py-3.5 bg-black border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={loading || !inputVal.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
                <span>Every message updates your academic memory & Today's Study Plan</span>
                <span>Press Enter to send</span>
              </div>
            </form>
          </div>
        </div>
      </Container>
    </main>
  );
};
