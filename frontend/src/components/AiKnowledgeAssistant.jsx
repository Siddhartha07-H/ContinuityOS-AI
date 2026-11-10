import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ChevronDown,
  User,
  Quote,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import { LoadingSpinner } from './Toast';

export function AiKnowledgeAssistant({ documents, showToast }) {
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    'What monthly volume does the Payment Gateway service process?',
    'Who is the backup engineer for Core Cluster SRE?',
    'Where are the root VPN credentials stored?',
    'What architectural decisions were made regarding Terraform?',
    'What pending tasks exist for Aurora PostgreSQL?',
  ];

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const history = await api.chat.getHistory();
      if (history && history.length > 0) {
        setMessages(history);
      } else {
        // Initial welcome message
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content:
              "Welcome to **ContinuityOS Knowledge Assistant**!\n\nI answer questions strictly based on your uploaded handover documents (PDF, Word DOCX, and TXT). I will never guess or invent unverified facts—if information is absent from your transition files, I will clearly mark it as **'Not Found in Documents'**.",
            citations: [],
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      // ignore
    }
  };

  const handleSend = async (queryText = inputQuery) => {
    const text = queryText?.trim();
    if (!text || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      citations: [],
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const docIds = selectedDocId === 'all' ? null : [Number(selectedDocId)];
      const res = await api.chat.ask(text, docIds);

      const asstMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.answer,
        citations: res.citations || [],
        found_in_docs: res.found_in_docs,
        ai_provider: res.ai_provider,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, asstMessage]);
    } catch (err) {
      showToast?.('error', 'Query Failed', err.message);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Error retrieving answer: ${err.message}`,
        citations: [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm('Clear all conversation history?')) return;
    try {
      await api.chat.clear();
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Chat conversation reset. Ask any question about your handover files.',
          citations: [],
          created_at: new Date().toISOString(),
        },
      ]);
      showToast?.('info', 'Chat Cleared', 'Conversation history was reset.');
    } catch (err) {
      showToast?.('error', 'Clear Error', err.message);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden">
      {/* Assistant Header & Scope Selector */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Continuity AI Knowledge Assistant</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                Grounded Q&A
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Answers strictly constrained to facts in uploaded documents.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Scope Selector */}
          <div className="relative">
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="px-3 py-1.5 pr-7 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 font-medium focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
            >
              <option value="all">Search All Documents ({documents?.length ?? 3})</option>
              {documents?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.filename}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={handleClearChat}
            className="p-1.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isNotFound = msg.content?.toLowerCase().includes('not found in documents');

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-sm'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : isNotFound
                    ? 'bg-amber-950/30 border border-amber-500/40 text-slate-200'
                    : 'bg-slate-800/80 border border-slate-700/60 text-slate-200'
                }`}
              >
                {/* Engine Source Badge */}
                {!isUser && msg.id !== 'welcome' && (
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-700/50 text-[10px]">
                    <span className={`inline-flex items-center gap-1 font-semibold ${msg.ai_provider === 'gemini' ? 'text-purple-300' : 'text-blue-400'}`}>
                      {msg.ai_provider === 'gemini' ? '✨ Google Gemini AI Output' : '⚙️ Heuristic Fallback Engine Output'}
                    </span>
                    {isNotFound && (
                      <span className="text-amber-400 font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        Grounded: Not Found
                      </span>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Citations Box */}
                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Quote className="w-3 h-3 text-cyan-400" />
                      <span>Verified Document Citations</span>
                    </span>
                    {msg.citations.map((c, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300"
                      >
                        <div className="font-semibold text-blue-400 flex items-center gap-1 mb-0.5">
                          <FileText className="w-3 h-3" />
                          <span>{c.document_name}</span>
                        </div>
                        <div className="text-slate-400 italic">"{c.excerpt}"</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>Continuity AI searching documents and synthesizing grounded response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Chips */}
      <div className="px-5 py-2.5 bg-slate-950/50 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[10px] text-slate-500 uppercase font-semibold shrink-0">
          Suggested:
        </span>
        {suggestedQuestions.map((sq, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(sq)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-[11px] text-slate-300 hover:text-white whitespace-nowrap transition-colors disabled:opacity-50"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-950/80 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask a question about your transition documents (e.g. credentials, decisions, runbooks)..."
            className="flex-1 px-4 py-2.5 text-xs bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-blue-500/20 disabled:opacity-40 transition-all flex items-center gap-1.5"
          >
            <span>Ask AI</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}

