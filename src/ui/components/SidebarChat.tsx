import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, ShieldAlert, Award, Star } from 'lucide-react';
import type { LogMessage } from '@/engine/model/Table';

interface SidebarChatProps {
  logs: LogMessage[];
  localPlayerId: string;
  hostId: string;
  onSendMessage: (content: string) => void;
  onClose?: () => void;
}

export function SidebarChat({
  logs = [],
  localPlayerId,
  hostId,
  onSendMessage,
  onClose,
}: SidebarChatProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  // Format timestamp (HH:MM)
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950/90 backdrop-blur-xl border-l border-white/5 text-slate-100 shadow-2xl relative">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/5 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-slate-100 tracking-wide text-sm sm:text-base">
            Historique & Tchat
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages / Logs Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-8">
            <MessageSquare className="w-8 h-8 opacity-30" />
            <p className="text-xs italic">Aucun message pour l'instant</p>
          </div>
        ) : (
          logs.map((log) => {
            if (log.type === 'system') {
              // System message design
              return (
                <div key={log.id} className="flex justify-center my-2">
                  <div className="max-w-[90%] text-center bg-indigo-950/20 border border-indigo-500/10 rounded-xl px-3 py-1.5 text-xs text-indigo-200/80 italic flex items-center gap-2 shadow-inner">
                    <ShieldAlert className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span>{log.content}</span>
                  </div>
                </div>
              );
            }

            // Chat message design
            const isMe = log.playerId === localPlayerId;
            const isHost = log.playerId === hostId;

            return (
              <div
                key={log.id}
                className={`flex gap-2.5 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg shadow-md">
                  {log.playerAvatar || '👤'}
                </div>

                {/* Message bubble content */}
                <div className="flex flex-col space-y-1">
                  <div className={`flex items-center gap-1.5 text-[11px] ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="font-semibold text-slate-300">
                      {log.playerName || 'Joueur'}
                    </span>
                    {isHost && (
                      <span className="inline-flex items-center px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 scale-90">
                        <Award className="w-2.5 h-2.5 mr-0.5" />
                        Hôte
                      </span>
                    )}
                    <span className="text-slate-500 scale-90">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-md break-all ${
                      isMe
                        ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none border border-indigo-500/20'
                        : 'bg-slate-900 border border-white/5 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {log.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-white/5 bg-slate-950 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Tapez un message..."
          maxLength={150}
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-white/5 text-slate-100 text-base sm:text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-md flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
