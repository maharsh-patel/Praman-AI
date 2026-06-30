import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, MessageSquare, Lightbulb, AlertTriangle, Send, Loader, ArrowRight } from 'lucide-react';

// Custom lightweight Markdown-like renderer for AI responses
const FormatAnswerText = ({ text }) => {
  if (!text) return null;
  
  // Split content by line and parse simple patterns (lists, headers, bold text)
  const lines = text.split('\n');
  
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        let trimmed = line.trim();
        
        // Header 3
        if (trimmed.startsWith('###')) {
          return <h4 key={idx} className="text-base font-bold text-slate-100 mt-3 mb-1">{trimmed.replace('###', '').trim()}</h4>;
        }
        // Header 2
        if (trimmed.startsWith('##')) {
          return <h3 key={idx} className="text-lg font-bold text-slate-100 mt-4 mb-2">{trimmed.replace('##', '').trim()}</h3>;
        }
        // List item
        if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
          const content = trimmed.substring(1).trim();
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-brand-500 mt-1.5 shrink-0">•</span>
              <span>{parseBoldText(content)}</span>
            </div>
          );
        }
        // Empty lines
        if (trimmed === '') {
          return <div key={idx} className="h-2"></div>;
        }
        // Normal paragraph
        return <p key={idx} className="text-slate-300">{parseBoldText(line)}</p>;
      })}
    </div>
  );
};

// Helper: Replaces **text** with <strong>text</strong>
const parseBoldText = (text) => {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, index) => {
    // Odd indexes represent matches within **bold**
    if (index % 2 === 1) {
      return <strong key={index} className="text-white font-bold">{part}</strong>;
    }
    return part;
  });
};

export default function InsightPanel({ metadata, previewRows }) {
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState(null);

  // Q&A State
  const [question, setQuestion] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const chatBottomRef = useRef(null);

  const promptChips = [
    "What are the main trends in this dataset?",
    "Identify any statistical anomalies or outliers.",
    "Give me 3 business recommendations based on this data.",
    "Summarize the columns and their completeness."
  ];

  // Auto-fetch insights on mount
  useEffect(() => {
    if (metadata && previewRows) {
      fetchInsights();
    }
  }, [metadata, previewRows]);

  // Autoscroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, loadingChat]);

  const fetchInsights = async () => {
    setLoadingInsights(true);
    setInsightsError(null);
    
    // Take a small sample of rows to avoid hitting payload limits (max 20 rows)
    const sample = previewRows.slice(0, 20);

    try {
      const response = await fetch('http://localhost:5000/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata, sampleRows: sample })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to fetch dataset insights.');
      
      setInsights(result);
    } catch (err) {
      console.error(err);
      setInsightsError(err.message || 'Offline mode: Mock statistics displayed.');
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleAskQuestion = async (userQuestionText) => {
    const queryText = userQuestionText || question;
    if (!queryText.trim() || loadingChat) return;

    // Add user message to log
    const updatedLog = [...chatLog, { role: 'user', content: queryText }];
    setChatLog(updatedLog);
    setQuestion('');
    setLoadingChat(true);

    const sample = previewRows.slice(0, 20);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata,
          sampleRows: sample,
          question: queryText,
          chatHistory: chatLog.slice(-6) // Keep last 3 exchanges (6 messages) for history
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to get answer from Q&A Agent.');

      setChatLog(prev => [...prev, { role: 'assistant', content: result.answer }]);
    } catch (err) {
      console.error(err);
      setChatLog(prev => [...prev, { 
        role: 'assistant', 
        content: `**Error answering question:** ${err.message}\n\n*Verify backend connection or Gemini API key.*` 
      }]);
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Executive Summary & Insights Panel (2 Cols) */}
      <div className="lg:col-span-2 space-y-6">
        
        {loadingInsights ? (
          <div className="glass-panel p-8 rounded-2xl animate-pulse space-y-4">
            <div className="flex items-center space-x-2">
              <Loader className="w-5 h-5 text-brand-500 animate-spin" />
              <div className="h-5 bg-slate-900 rounded w-1/3"></div>
            </div>
            <div className="h-4 bg-slate-900 rounded w-full"></div>
            <div className="h-4 bg-slate-900 rounded w-5/6"></div>
            <div className="h-4 bg-slate-900 rounded w-4/5"></div>
            <div className="h-32 bg-slate-950/30 rounded border border-slate-900/60 mt-6"></div>
          </div>
        ) : insights ? (
          <div className="space-y-6">
            
            {/* Executive Summary */}
            <div className="glass-panel p-6 rounded-2xl">
              <div className="flex items-center space-x-2 mb-4 border-b border-slate-900 pb-3">
                <Sparkles className="w-5 h-5 text-brand-500" />
                <h2 className="text-xl font-bold text-slate-100">Executive Summary</h2>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {insights.executiveSummary}
              </p>
            </div>

            {/* Key Findings & Recommendations Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Key Findings */}
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <div className="flex items-center space-x-2 text-sky-400 font-semibold border-b border-slate-900 pb-2.5">
                  <ArrowRight className="w-4 h-4" />
                  <h3>Key Findings</h3>
                </div>
                <ul className="space-y-3">
                  {insights.keyFindings?.map((item, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-300 leading-normal">
                      <span className="text-sky-500 mt-1 shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Business Recommendations */}
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold border-b border-slate-900 pb-2.5">
                  <Lightbulb className="w-4 h-4" />
                  <h3>Recommendations</h3>
                </div>
                <ul className="space-y-3">
                  {insights.businessRecommendations?.map((item, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-300 leading-normal">
                      <span className="text-emerald-500 mt-1 shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Anomalies / Warnings (If any) */}
            {insights.anomaliesOrWarnings && insights.anomaliesOrWarnings.length > 0 && (
              <div className="bg-amber-950/20 border border-amber-900/50 p-5 rounded-2xl flex gap-3.5">
                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-amber-300">Data Anomalies & Warnings</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                    {insights.anomaliesOrWarnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="glass-panel p-6 rounded-2xl text-center text-slate-500">
            Click reload or configure your Gemini API Key in `.env` to analyze this dataset.
          </div>
        )}
      </div>

      {/* AI Q&A Agent Chat Box (1 Col) */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-[600px]">
        
        {/* Chat Header */}
        <div className="flex items-center space-x-2 border-b border-slate-900 pb-3">
          <MessageSquare className="w-5 h-5 text-brand-500" />
          <div>
            <h3 className="font-bold text-slate-100">Ask the Data Agent</h3>
            <p className="text-[10px] text-slate-500">Natural Language Q&A Interface</p>
          </div>
        </div>

        {/* Chat Logs */}
        <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1">
          {chatLog.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4">
              <MessageSquare className="w-10 h-10 text-slate-700 animate-pulse" />
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-slate-400">No messages yet</p>
                <p className="text-xs text-slate-500">Ask specific questions about summaries, columns, or values in your uploaded file.</p>
              </div>
              
              {/* Chips suggestions */}
              <div className="w-full flex flex-col gap-2 mt-4">
                {promptChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskQuestion(chip)}
                    className="text-[11px] text-left p-2.5 bg-slate-950/60 border border-slate-900 rounded-lg text-slate-400 hover:border-slate-800 hover:text-slate-200 transition-all"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            chatLog.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[90%] rounded-xl px-4 py-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-750 text-white rounded-br-none shadow-md shadow-brand-500/5'
                      : 'bg-slate-950/80 border border-slate-900 text-slate-300 rounded-bl-none'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p>{msg.content}</p>
                  ) : (
                    <FormatAnswerText text={msg.content} />
                  )}
                </div>
                <span className="text-[9px] text-slate-600 mt-1 px-1">
                  {msg.role === 'user' ? 'You' : 'Data Agent AI'}
                </span>
              </div>
            ))
          )}

          {loadingChat && (
            <div className="flex items-center space-x-2 text-slate-500 p-2 text-xs">
              <Loader className="w-3.5 h-3.5 animate-spin text-brand-500" />
              <span>Agent is thinking...</span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Chat Input */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleAskQuestion(); }}
          className="flex items-center gap-2 border border-slate-900 bg-slate-950/80 p-1.5 rounded-xl"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about your data..."
            className="flex-1 bg-transparent text-xs text-slate-200 pl-2.5 focus:outline-none placeholder-slate-600"
            disabled={loadingChat}
          />
          <button
            type="submit"
            disabled={!question.trim() || loadingChat}
            className="p-2 bg-brand-700 hover:bg-brand-600 disabled:opacity-40 disabled:hover:bg-brand-700 text-white rounded-lg transition-all"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>
    </div>
  );
}
